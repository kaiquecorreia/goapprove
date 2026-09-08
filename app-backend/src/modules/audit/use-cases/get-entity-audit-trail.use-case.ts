import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { AuditQueryService } from '../services/audit-query.service';
import { AuditEventResponse } from '../types/audit-event-response';

@Injectable()
export class GetEntityAuditTrailUseCase {
  constructor(private readonly auditQueryService: AuditQueryService) {}

  execute(
    user: AuthenticatedUser,
    entity: string,
    entityId: string,
  ): Promise<AuditEventResponse[]> {
    return this.auditQueryService.findEntityTrail(user, entity, entityId);
  }
}
