// Audit payloads are captured straight off request bodies and entity
// snapshots, so they routinely contain credentials (PATCH /users/:id/password)
// and secrets (the company integration clientSecret). Redaction here is the
// only thing standing between those values and a permanent database row.
const REDACTED_KEYS = new Set([
  'password',
  'newpassword',
  'currentpassword',
  'confirmpassword',
  'passwordhash',
  'clientsecret',
  'secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'apikey',
  'x-internal-api-key',
]);

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 6;
const MAX_ARRAY_LENGTH = 50;
const MAX_STRING_LENGTH = 2_000;
const MAX_JSON_BYTES = 16 * 1024;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function truncateString(value: string): string {
  return value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]`
    : value;
}

function walk(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  // Prisma Decimal and similar wrappers serialise usefully via toString().
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  if (depth >= MAX_DEPTH) {
    return '[depth limit]';
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => walk(item, depth + 1));

    return value.length > MAX_ARRAY_LENGTH
      ? [...items, `[${value.length - MAX_ARRAY_LENGTH} more]`]
      : items;
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        result[key] = REDACTED;
        continue;
      }

      const sanitized = walk(entry, depth + 1);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  // Class instances (Prisma Decimal, custom entities) reach here.
  const asObject = value as { toJSON?: () => unknown; toString?: () => string };

  if (typeof asObject.toJSON === 'function') {
    return walk(asObject.toJSON(), depth + 1);
  }

  return typeof asObject.toString === 'function'
    ? truncateString(asObject.toString())
    : undefined;
}

/**
 * Redacts credentials and caps size before a value is persisted as JSON.
 * Returns undefined for values that carry nothing worth storing.
 */
export function sanitize(value: unknown): unknown {
  if (value === undefined || value === null) {
    return undefined;
  }

  const sanitized = walk(value, 0);

  if (sanitized === undefined) {
    return undefined;
  }

  const bytes = Buffer.byteLength(JSON.stringify(sanitized) ?? '', 'utf8');

  // A purchase order payload with every line would otherwise make the audit
  // trail the largest consumer of disk in the system.
  return bytes > MAX_JSON_BYTES ? { truncated: true, bytes } : sanitized;
}

export const SANITIZE_LIMITS = {
  MAX_DEPTH,
  MAX_ARRAY_LENGTH,
  MAX_STRING_LENGTH,
  MAX_JSON_BYTES,
} as const;
