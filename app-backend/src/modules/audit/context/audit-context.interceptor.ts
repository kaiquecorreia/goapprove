import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

import { AuditContextService } from './audit-context.service';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  constructor(private readonly auditContext: AuditContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    // Mutates the store opened by AuditContextMiddleware. Interceptors run
    // after the guards, so request.user is populated by now.
    this.auditContext.setActor(
      user
        ? {
            type: 'USER',
            userId: user.userId,
            label: user.name ?? user.email,
            role: user.role,
            companyId: user.companyId,
          }
        : // No JWT, but the global InternalApiKeyGuard let it through.
          { type: 'INTEGRATION', label: 'internal-api-key' },
    );

    const store = this.auditContext.get();

    if (store) {
      context
        .switchToHttp()
        .getResponse<Response>()
        .setHeader('x-correlation-id', store.correlationId);
    }

    return next.handle();
  }
}
