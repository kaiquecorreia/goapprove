import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { CompanyAccessService } from '../../company/services/company-access.service';
import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import {
  DEFAULT_AUDIT_WINDOW_DAYS,
  ListAuditEventsDto,
} from '../dtos/list-audit-events.dto';
import {
  AuditRepository,
  FindAuditEventsCriteria,
} from '../repositories/audit.repository';
import {
  AuditEventResponse,
  AuditEventsPage,
  toAuditEventResponse,
} from '../types/audit-event-response';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SEARCH_WINDOW_DAYS = 7;

@Injectable()
export class AuditQueryService {
  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly companyAccessService: CompanyAccessService,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListAuditEventsDto,
  ): Promise<AuditEventsPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const dateFrom = query.dateFrom
      ? new Date(query.dateFrom)
      : new Date(Date.now() - DEFAULT_AUDIT_WINDOW_DAYS * DAY_MS);
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

    this.assertSearchIsBounded(query, dateFrom, dateTo);

    const scope = await this.resolveCompanyScope(user, query.companyId);

    const criteria: FindAuditEventsCriteria = {
      ...scope,
      skip: (page - 1) * limit,
      take: limit,
      action: query.action,
      entity: query.entity,
      entityId: query.entityId,
      actorUserId: query.actorUserId,
      correlationId: query.correlationId,
      severity: query.severity,
      search: query.search,
      dateFrom,
      dateTo,
    };

    const { items, total } = await this.auditRepository.find(criteria);

    return { items: items.map(toAuditEventResponse), total, page, limit };
  }

  async findEntityTrail(
    user: AuthenticatedUser,
    entity: string,
    entityId: string,
  ): Promise<AuditEventResponse[]> {
    const events = await this.auditRepository.findByEntity(entity, entityId);
    const accessibleCompanyIds =
      await this.companyAccessService.getAccessibleCompanyIds(user);

    if (accessibleCompanyIds === null) {
      return events.map(toAuditEventResponse);
    }

    return events
      .filter(
        (event) =>
          event.companyId !== null &&
          accessibleCompanyIds.includes(event.companyId),
      )
      .map(toAuditEventResponse);
  }

  private async resolveCompanyScope(
    user: AuthenticatedUser,
    requestedCompanyId?: string,
  ): Promise<Pick<FindAuditEventsCriteria, 'companyId' | 'companyIds'>> {
    const accessibleCompanyIds =
      await this.companyAccessService.getAccessibleCompanyIds(user);

    // ADMINISTRATOR: unrestricted, including events with no company at all
    // (logins, integration calls), which the `in` filter below would exclude.
    if (accessibleCompanyIds === null) {
      return { companyId: requestedCompanyId };
    }

    if (
      requestedCompanyId &&
      !accessibleCompanyIds.includes(requestedCompanyId)
    ) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return {
      companyIds: requestedCompanyId
        ? [requestedCompanyId]
        : accessibleCompanyIds,
    };
  }

  // There is no text index on `message` (a GIN index would cost far more on
  // write than free-text search is worth here), so an unbounded ILIKE scan is
  // rejected rather than silently running as a sequential scan.
  private assertSearchIsBounded(
    query: ListAuditEventsDto,
    dateFrom: Date,
    dateTo: Date | undefined,
  ): void {
    if (!query.search) {
      return;
    }

    const hasNarrowingFilter = Boolean(
      query.action || query.entity || query.entityId || query.actorUserId,
    );

    if (hasNarrowingFilter) {
      return;
    }

    const windowDays =
      ((dateTo ?? new Date()).getTime() - dateFrom.getTime()) / DAY_MS;

    if (windowDays > MAX_SEARCH_WINDOW_DAYS) {
      throw new BadRequestException(
        `Free-text search requires another filter (action, entity, entityId or actorUserId) or a window of at most ${MAX_SEARCH_WINDOW_DAYS} days`,
      );
    }
  }
}
