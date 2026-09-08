import { Injectable, Logger } from '@nestjs/common';

import { TransactionService } from '../../../shared/prisma/transaction.service';
import {
  AuditActor,
  AuditContextService,
} from '../context/audit-context.service';
import { CreateAuditEventInput } from '../repositories/audit.repository';
import { AuditSeverity } from '../types/audit-severity';
import { AuditWriter } from './audit-writer.service';
import { sanitize } from './sanitize';

export interface AuditLogInput {
  action: string;
  entity: string;
  entityId?: string | null;
  companyId?: string | null;
  severity?: AuditSeverity;
  message?: string | null;
  metadata?: Record<string, unknown>;
  before?: unknown;
  after?: unknown;
  /** Overrides the actor resolved from the request context. */
  actor?: Partial<AuditActor>;
  /** Persist before returning instead of buffering. */
  critical?: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditContext: AuditContextService,
    private readonly transactionService: TransactionService,
    private readonly writer: AuditWriter,
  ) {}

  /**
   * Records an audit event. Synchronous, returns void, and never throws --
   * callers include catch blocks (see LnSyncService#markFailed), so a failure
   * here must never mask the original error.
   */
  log(input: AuditLogInput): void {
    try {
      // Built now, while the ALS scope is still active: the post-commit
      // callback runs outside it and would read an empty context.
      const row = this.buildRow(input);

      if (input.critical) {
        this.transactionService.onCommit(() => void this.writer.writeNow(row));
        return;
      }

      this.transactionService.onCommit(() => this.writer.enqueue(row));
    } catch (error) {
      this.logger.error(
        `Failed to enqueue audit event ${input.action}`,
        error as Error,
      );
    }
  }

  /** Awaited variant. Also never throws. */
  async logNow(input: AuditLogInput): Promise<void> {
    try {
      await this.writer.writeNow(this.buildRow(input));
    } catch (error) {
      this.logger.error(
        `Failed to write audit event ${input.action}`,
        error as Error,
      );
    }
  }

  private buildRow(input: AuditLogInput): CreateAuditEventInput {
    const context = this.auditContext.get();
    const actor: AuditActor = {
      ...(context?.actor ?? { type: 'SYSTEM', label: 'system' }),
      ...input.actor,
    };

    return {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      severity: input.severity ?? 'info',
      message: input.message ?? null,
      // Falls back to the acting user's company so callers rarely pass it.
      companyId: input.companyId ?? actor.companyId ?? null,
      actorUserId: actor.userId ?? null,
      actorType: actor.type,
      actorLabel: actor.label,
      correlationId: context?.correlationId ?? null,
      ip: context?.ip ?? null,
      userAgent: context?.userAgent ?? null,
      httpMethod: context?.httpMethod ?? null,
      httpPath: context?.httpPath ?? null,
      metadata: sanitize(input.metadata),
      // A snapshot stashed via auditContext.setBefore() wins only when the
      // caller did not pass one explicitly.
      before: sanitize(input.before ?? context?.before),
      after: sanitize(input.after),
    };
  }
}
