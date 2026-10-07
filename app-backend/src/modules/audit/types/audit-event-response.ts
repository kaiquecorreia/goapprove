import { AuditEventWithCompany } from '../repositories/audit.repository';

/**
 * Shape consumed by the web audit screen. Field names mirror what the UI
 * already expects, so the client needs no mapping layer of its own.
 */
export interface AuditEventResponse {
  id: string;
  at: Date;
  user: string;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  correlationId: string | null;
  severity: string;
  message: string | null;
  companyId: string | null;
  companyName: string | null;
  actorUserId: string | null;
  actorType: string;
  httpMethod: string | null;
  httpPath: string | null;
  metadata: unknown;
  before: unknown;
  after: unknown;
}

export interface AuditEventsPage {
  items: AuditEventResponse[];
  total: number;
  page: number;
  limit: number;
}

export function toAuditEventResponse(
  event: AuditEventWithCompany,
): AuditEventResponse {
  return {
    id: event.auditEventId,
    at: event.createdAt,
    user: event.actorLabel ?? 'system',
    action: event.action,
    entity: event.entity,
    entityId: event.entityId,
    ip: event.ip,
    userAgent: event.userAgent,
    correlationId: event.correlationId,
    severity: event.severity,
    message: event.message,
    companyId: event.companyId,
    companyName: event.company?.name ?? null,
    actorUserId: event.actorUserId,
    actorType: event.actorType,
    httpMethod: event.httpMethod,
    httpPath: event.httpPath,
    metadata: event.metadata,
    before: event.before,
    after: event.after,
  };
}
