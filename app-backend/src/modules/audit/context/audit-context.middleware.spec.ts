import { Request, Response } from 'express';

import {
  AuditContextService,
  AuditRequestContext,
} from './audit-context.service';
import { AuditContextMiddleware } from './audit-context.middleware';

describe('AuditContextMiddleware', () => {
  let auditContext: AuditContextService;
  let middleware: AuditContextMiddleware;

  beforeEach(() => {
    auditContext = new AuditContextService();
    middleware = new AuditContextMiddleware(auditContext);
  });

  function buildRequest(overrides: Partial<Request> = {}): Request {
    return {
      headers: {},
      method: 'GET',
      originalUrl: '/rules',
      ip: undefined,
      socket: { remoteAddress: '10.0.0.5' },
      ...overrides,
    } as unknown as Request;
  }

  function run(request: Request): AuditRequestContext {
    let captured: AuditRequestContext | undefined;
    middleware.use(request, {} as Response, () => {
      captured = auditContext.get();
    });
    return captured!;
  }

  it('prefers the BFF-forwarded x-forwarded-for over the TCP peer address', () => {
    const context = run(
      buildRequest({
        headers: {
          'x-forwarded-for': '187.45.12.9',
          'user-agent': 'Chrome/1.0',
        },
        ip: '::ffff:192.168.32.4',
      }),
    );

    expect(context.ip).toBe('187.45.12.9');
    expect(context.userAgent).toBe('Chrome/1.0');
  });

  it('takes only the first hop of a multi-value x-forwarded-for', () => {
    const context = run(
      buildRequest({
        headers: { 'x-forwarded-for': '187.45.12.9, 10.0.0.1, 10.0.0.2' },
      }),
    );

    expect(context.ip).toBe('187.45.12.9');
  });

  it('falls back to the peer address when nothing is forwarded (direct calls, tests)', () => {
    const context = run(buildRequest({ ip: '::ffff:192.168.32.4' }));

    expect(context.ip).toBe('::ffff:192.168.32.4');
  });

  it('falls back to the socket address when req.ip is also unavailable', () => {
    const context = run(buildRequest());

    expect(context.ip).toBe('10.0.0.5');
  });

  it('generates a correlation id when none is supplied', () => {
    const context = run(buildRequest());

    expect(context.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('rejects a non-uuid x-correlation-id instead of failing the insert later', () => {
    const context = run(
      buildRequest({ headers: { 'x-correlation-id': 'not-a-uuid' } }),
    );

    expect(context.correlationId).not.toBe('not-a-uuid');
  });

  it('reuses a valid caller-supplied correlation id', () => {
    const supplied = '11111111-2222-4333-8444-555555555555';

    const context = run(
      buildRequest({ headers: { 'x-correlation-id': supplied } }),
    );

    expect(context.correlationId).toBe(supplied);
  });
});
