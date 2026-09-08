import { SetMetadata } from '@nestjs/common';

import { AuditSeverity } from '../types/audit-severity';

export const AUDIT_METADATA_KEY = 'audit:options';

export interface AuditOptions {
  /** Canonical dotted action, e.g. "rule.update", "user.create". */
  action: string;
  /** Entity name, e.g. "Rule", "User", "PurchaseOrder". */
  entity: string;
  /**
   * Where to read the entity id from: "params.x", "body.x", "query.x" or
   * "result.x" (nested paths allowed, e.g. "result.workflow.workflowId").
   * Omitted, falls back to the convention
   * result.<entity>Id -> params.<entity>Id -> params.id -> body.<entity>Id.
   */
  entityIdFrom?: string;
  /** Same syntax. Omitted, uses result.companyId then the actor's company. */
  companyIdFrom?: string;
  severity?: AuditSeverity;
  message?: string;
  /** Store the handler's return value as the "after" snapshot. Default true. */
  captureAfter?: boolean;
  /** Store the request body under metadata.request. Default false. */
  captureBody?: boolean;
  /** Persist before responding instead of buffering. Default false. */
  critical?: boolean;
  /** Also record failures, with severity "error". Default false. */
  auditFailure?: boolean;
}

/**
 * Marks a route handler for auditing. Actor, IP, user agent, correlation id,
 * HTTP method and path are captured automatically from the request context.
 */
export const Audit = (options: AuditOptions) =>
  SetMetadata(AUDIT_METADATA_KEY, options);
