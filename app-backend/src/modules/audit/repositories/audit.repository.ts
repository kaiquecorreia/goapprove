import { AuditEvent } from '@prisma/client';

import { AuditSeverity } from '../types/audit-severity';
import { AuditActorType } from '../context/audit-context.service';

export interface CreateAuditEventInput {
  action: string;
  entity: string;
  entityId?: string | null;
  severity: AuditSeverity;
  message?: string | null;
  companyId?: string | null;
  actorUserId?: string | null;
  actorType: AuditActorType;
  actorLabel?: string | null;
  correlationId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  httpMethod?: string | null;
  httpPath?: string | null;
  metadata?: unknown;
  before?: unknown;
  after?: unknown;
}

export interface FindAuditEventsCriteria {
  // Unrestricted (ADMINISTRATOR) when both are undefined.
  companyId?: string;
  companyIds?: string[];
  skip: number;
  take: number;
  action?: string;
  entity?: string;
  entityId?: string;
  actorUserId?: string;
  correlationId?: string;
  severity?: AuditSeverity;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface FindAuditEventsResult {
  items: AuditEvent[];
  total: number;
}

export abstract class AuditRepository {
  abstract createMany(events: CreateAuditEventInput[]): Promise<void>;

  abstract find(
    criteria: FindAuditEventsCriteria,
  ): Promise<FindAuditEventsResult>;

  abstract findByEntity(
    entity: string,
    entityId: string,
  ): Promise<AuditEvent[]>;
}
