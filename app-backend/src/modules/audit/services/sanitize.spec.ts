import { SANITIZE_LIMITS, sanitize } from './sanitize';

describe('sanitize', () => {
  it('redacts credentials regardless of casing', () => {
    const result = sanitize({
      email: 'someone@example.com',
      password: 'hunter2',
      newPassword: 'hunter3',
      clientSecret: 'sh-abc',
      token: 'jwt-value',
    }) as Record<string, unknown>;

    expect(result.email).toBe('someone@example.com');
    expect(result.password).toBe('[REDACTED]');
    expect(result.newPassword).toBe('[REDACTED]');
    expect(result.clientSecret).toBe('[REDACTED]');
    expect(result.token).toBe('[REDACTED]');
  });

  it('redacts credentials nested inside objects and arrays', () => {
    const result = sanitize({
      integrations: [{ baseUrl: 'https://ln', clientSecret: 'secret' }],
    }) as { integrations: Record<string, unknown>[] };

    expect(result.integrations[0].baseUrl).toBe('https://ln');
    expect(result.integrations[0].clientSecret).toBe('[REDACTED]');
  });

  it('caps recursion depth', () => {
    let deep: Record<string, unknown> = { value: 'bottom' };
    for (let i = 0; i < 12; i += 1) {
      deep = { nested: deep };
    }

    expect(JSON.stringify(sanitize(deep))).toContain('[depth limit]');
  });

  it('caps long arrays and reports how many were dropped', () => {
    const result = sanitize({
      lines: Array.from({ length: 60 }, (_, index) => index),
    }) as { lines: unknown[] };

    expect(result.lines).toHaveLength(SANITIZE_LIMITS.MAX_ARRAY_LENGTH + 1);
    expect(result.lines.at(-1)).toBe('[10 more]');
  });

  it('truncates very long strings', () => {
    const result = sanitize({
      note: 'x'.repeat(SANITIZE_LIMITS.MAX_STRING_LENGTH + 500),
    }) as { note: string };

    expect(result.note.endsWith('…[truncated]')).toBe(true);
    expect(result.note.length).toBeLessThan(
      SANITIZE_LIMITS.MAX_STRING_LENGTH + 20,
    );
  });

  it('replaces oversized payloads with a size marker', () => {
    const result = sanitize({
      lines: Array.from({ length: 50 }, () => ({
        description: 'y'.repeat(1_500),
      })),
    }) as { truncated?: boolean; bytes?: number };

    expect(result.truncated).toBe(true);
    expect(result.bytes).toBeGreaterThan(SANITIZE_LIMITS.MAX_JSON_BYTES);
  });

  it('returns undefined for empty values so the column stays null', () => {
    expect(sanitize(undefined)).toBeUndefined();
    expect(sanitize(null)).toBeUndefined();
  });

  it('serialises dates and bigints', () => {
    const result = sanitize({
      at: new Date('2026-06-20T08:12:00.000Z'),
      total: BigInt(42),
    }) as Record<string, unknown>;

    expect(result.at).toBe('2026-06-20T08:12:00.000Z');
    expect(result.total).toBe('42');
  });
});
