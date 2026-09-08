import { Injectable } from '@nestjs/common';
import { AuditEvent, Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  AuditRepository,
  CreateAuditEventInput,
  FindAuditEventsCriteria,
  FindAuditEventsResult,
} from './audit.repository';

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined || value === null ? undefined : value;
}

@Injectable()
export class PrismaAuditRepository extends AuditRepository {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  // Writes deliberately use the root client: an audit event must survive a
  // rollback of the work that produced it. AuditService only enqueues after
  // the surrounding transaction commits, so this never records aborted work.
  async createMany(events: CreateAuditEventInput[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.prismaService.getRootClient().auditEvent.createMany({
      data: events.map((event) => ({
        action: event.action,
        entity: event.entity,
        entityId: event.entityId ?? null,
        severity: event.severity,
        message: event.message ?? null,
        companyId: event.companyId ?? null,
        actorUserId: event.actorUserId ?? null,
        actorType: event.actorType,
        actorLabel: event.actorLabel ?? null,
        correlationId: event.correlationId ?? null,
        ip: event.ip ?? null,
        userAgent: event.userAgent ?? null,
        httpMethod: event.httpMethod ?? null,
        httpPath: event.httpPath ?? null,
        metadata: toJson(event.metadata),
        before: toJson(event.before),
        after: toJson(event.after),
      })),
    });
  }

  async find(
    criteria: FindAuditEventsCriteria,
  ): Promise<FindAuditEventsResult> {
    const where = this.buildWhere(criteria);
    const client = this.prismaService.getClient();

    const [items, total] = await Promise.all([
      client.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: criteria.skip,
        take: criteria.take,
      }),
      client.auditEvent.count({ where }),
    ]);

    return { items, total };
  }

  // Served by the (entity, entity_id, created_at) index. Ascending because
  // timelines render oldest first.
  async findByEntity(entity: string, entityId: string): Promise<AuditEvent[]> {
    return this.prismaService.getClient().auditEvent.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private buildWhere(
    criteria: FindAuditEventsCriteria,
  ): Prisma.AuditEventWhereInput {
    return {
      ...(criteria.companyId && { companyId: criteria.companyId }),
      // Note: `in` excludes NULL in Prisma, so events with no company (login,
      // integration calls) are only visible to unrestricted callers. Intended.
      ...(criteria.companyIds && { companyId: { in: criteria.companyIds } }),
      ...(criteria.action && { action: criteria.action }),
      ...(criteria.entity && { entity: criteria.entity }),
      ...(criteria.entityId && { entityId: criteria.entityId }),
      ...(criteria.actorUserId && { actorUserId: criteria.actorUserId }),
      ...(criteria.correlationId && { correlationId: criteria.correlationId }),
      ...(criteria.severity && { severity: criteria.severity }),
      ...(criteria.search && {
        message: { contains: criteria.search, mode: 'insensitive' as const },
      }),
      ...((criteria.dateFrom || criteria.dateTo) && {
        createdAt: {
          ...(criteria.dateFrom && { gte: criteria.dateFrom }),
          ...(criteria.dateTo && { lte: criteria.dateTo }),
        },
      }),
    };
  }
}
