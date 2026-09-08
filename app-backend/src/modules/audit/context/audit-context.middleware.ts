import { randomUUID } from 'crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { AuditContextService } from './audit-context.service';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_USER_AGENT_LENGTH = 512;
const MAX_PATH_LENGTH = 255;
const MAX_IP_LENGTH = 45;

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  constructor(private readonly auditContext: AuditContextService) {}

  use(request: Request, _response: Response, next: NextFunction): void {
    this.auditContext.run(
      {
        correlationId: this.resolveCorrelationId(request),
        ip: this.resolveIp(request),
        userAgent:
          this.header(request, 'user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ??
          null,
        httpMethod: request.method,
        httpPath: request.originalUrl.split('?')[0].slice(0, MAX_PATH_LENGTH),
        // Seed value; promoted to USER/INTEGRATION by AuditContextInterceptor
        // once the guards have populated request.user.
        actor: { type: 'SYSTEM', label: 'system' },
      },
      () => next(),
    );
  }

  // The column is @db.Uuid, so an arbitrary header value would fail the insert.
  private resolveCorrelationId(request: Request): string {
    const incoming = this.header(request, 'x-correlation-id');

    return incoming && UUID_PATTERN.test(incoming) ? incoming : randomUUID();
  }

  // The Next.js BFF is the only caller reaching this middleware (gated by
  // InternalApiKeyGuard), and forwards the real browser IP via this header
  // when it knows one (see app-web's requestContext.ts) — it is read
  // directly rather than through Express's req.ip/trust-proxy machinery,
  // since the immediate TCP peer is always the BFF container, never the
  // browser. Falls back to the peer address for callers that don't forward it
  // (direct integration calls, tests).
  private resolveIp(request: Request): string | null {
    const forwarded = this.header(request, 'x-forwarded-for');
    const forwardedIp = forwarded?.split(',')[0]?.trim();
    const ip = forwardedIp || request.ip || request.socket.remoteAddress;

    return ip ? ip.slice(0, MAX_IP_LENGTH) : null;
  }

  private header(request: Request, name: string): string | undefined {
    const value = request.headers[name];

    return Array.isArray(value) ? value[0] : value;
  }
}
