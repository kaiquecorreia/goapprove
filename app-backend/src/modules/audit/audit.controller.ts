import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AuthenticatedUser } from '../../shared/types/authenticated-user';
import { ListAuditEventsDto } from './dtos/list-audit-events.dto';
import { GetEntityAuditTrailUseCase } from './use-cases/get-entity-audit-trail.use-case';
import { ListAuditEventsUseCase } from './use-cases/list-audit-events.use-case';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
// Restricted to ADMINISTRATOR: the trail exposes IPs, user agents and change
// diffs belonging to other users, including OWNER's own actions.
@Roles(UserRole.ADMINISTRATOR)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly listAuditEventsUseCase: ListAuditEventsUseCase,
    private readonly getEntityAuditTrailUseCase: GetEntityAuditTrailUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List audit events, newest first, scoped to the companies the caller can access',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'companyId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'actorUserId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'correlationId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  list(
    @Query() query: ListAuditEventsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listAuditEventsUseCase.execute(user, query);
  }

  @Get('entities/:entity/:entityId')
  @ApiOperation({
    summary: 'Full audit trail for one entity, oldest first',
  })
  @ApiParam({ name: 'entity', example: 'PurchaseOrder' })
  @ApiParam({ name: 'entityId' })
  findEntityTrail(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getEntityAuditTrailUseCase.execute(user, entity, entityId);
  }
}
