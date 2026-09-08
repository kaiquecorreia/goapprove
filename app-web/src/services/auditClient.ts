import type { AuditEvent, AuditEventsPage, AuditSeverity } from '@/lib/mock/types';

export interface AuditEventsFilters {
  page: number;
  limit: number;
  search?: string;
  action?: string;
  entity?: string;
  actorUserId?: string;
  correlationId?: string;
  severity?: AuditSeverity;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface RawAuditEvent {
  id: string;
  at: string;
  user: string;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  correlationId: string | null;
  severity: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

interface RawAuditResponse {
  items: RawAuditEvent[];
  total: number;
  page: number;
  limit: number;
}

const EM_DASH = '—';

function toAuditEvent(event: RawAuditEvent): AuditEvent {
  return {
    id: event.id,
    at: event.at,
    user: event.user,
    action: event.action,
    entity: event.entity,
    entityId: event.entityId ?? EM_DASH,
    ip: event.ip ?? EM_DASH,
    userAgent: event.userAgent ?? EM_DASH,
    correlationId: event.correlationId ?? EM_DASH,
    severity: event.severity as AuditSeverity,
    message: event.message ?? undefined,
    metadata: event.metadata ?? undefined,
    before: event.before ?? undefined,
    after: event.after ?? undefined,
  };
}

export async function getAuditEvents(filters: AuditEventsFilters): Promise<AuditEventsPage> {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.action) params.set('action', filters.action);
  if (filters.entity) params.set('entity', filters.entity);
  if (filters.actorUserId) params.set('actorUserId', filters.actorUserId);
  if (filters.correlationId) params.set('correlationId', filters.correlationId);
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.companyId) params.set('companyId', filters.companyId);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);

  const response = await fetch(`/api/audit?${params.toString()}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('; ') : data?.message;
    throw new Error(message ?? 'Falha ao carregar eventos de auditoria');
  }

  const raw = data as RawAuditResponse;

  return {
    items: raw.items.map(toAuditEvent),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  };
}
