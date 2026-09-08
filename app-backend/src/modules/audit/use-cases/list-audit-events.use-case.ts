import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { ListAuditEventsDto } from '../dtos/list-audit-events.dto';
import { AuditQueryService } from '../services/audit-query.service';
import { AuditEventsPage } from '../types/audit-event-response';

@Injectable()
export class ListAuditEventsUseCase {
  constructor(private readonly auditQueryService: AuditQueryService) {}

  execute(
    user: AuthenticatedUser,
    query: ListAuditEventsDto,
  ): Promise<AuditEventsPage> {
    return this.auditQueryService.list(user, query);
  }
}
