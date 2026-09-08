import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

import {
  AUDIT_METADATA_KEY,
  AuditOptions,
} from '../decorators/audit.decorator';
import { AuditService } from '../services/audit.service';
import { buildAuditEntry } from './audit-entry.builder';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<AuditOptions | undefined>(
      AUDIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options || context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap({
        // Success branch only: the handler resolved, so the mutation happened.
        next: (result) => {
          // log() is synchronous, returns void and never throws, so this adds
          // no latency and cannot break the response.
          this.auditService.log(buildAuditEntry(options, request, result));
        },
        error: (error: unknown) => {
          if (!options.auditFailure) {
            return;
          }

          this.auditService.log(
            buildAuditEntry(options, request, undefined, error),
          );
        },
      }),
    );
  }
}
