import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AuthenticatedUser } from '../../shared/types/authenticated-user';
import { ListPendingWorkflowsDto } from './dtos/list-pending-workflows.dto';
import { RecordDecisionDto } from './dtos/record-decision.dto';
import { GetPendingApprovalsUseCase } from './use-cases/get-pending-approvals.use-case';
import { GetWorkflowUseCase } from './use-cases/get-workflow.use-case';
import { RecordDecisionUseCase } from './use-cases/record-decision.use-case';
import { RetryLnSyncUseCase } from './use-cases/retry-ln-sync.use-case';

@ApiTags('Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflows')
export class WorkflowController {
  constructor(
    private readonly getPendingApprovalsUseCase: GetPendingApprovalsUseCase,
    private readonly getWorkflowUseCase: GetWorkflowUseCase,
    private readonly recordDecisionUseCase: RecordDecisionUseCase,
    private readonly retryLnSyncUseCase: RetryLnSyncUseCase,
  ) {}

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMINISTRATOR, UserRole.APPROVER)
  @ApiOperation({
    summary:
      'List pending purchase orders. OWNER/ADMINISTRATOR see every pending PO in the company; APPROVER sees only their own assignments (direct and substitute-eligible ones)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Purchase order number',
  })
  @ApiQuery({ name: 'companyId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'supplierCode', required: false })
  @ApiQuery({ name: 'requesterCode', required: false })
  @ApiQuery({ name: 'costCenter', required: false })
  @ApiResponse({ status: 200, description: 'Pending workflows listed' })
  findPending(
    @Query() query: ListPendingWorkflowsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getPendingApprovalsUseCase.execute(user, query);
  }

  @Get(':purchaseOrderId')
  @ApiOperation({
    summary: 'Get the full approval workflow for a purchase order',
  })
  @ApiParam({ name: 'purchaseOrderId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Workflow found' })
  @ApiResponse({
    status: 404,
    description: 'No workflow found for this purchase order',
  })
  findByPurchaseOrder(
    @Param('purchaseOrderId', new ParseUUIDPipe({ version: '4' }))
    purchaseOrderId: string,
    @CurrentUser() actingUser: AuthenticatedUser,
  ) {
    return this.getWorkflowUseCase.execute(purchaseOrderId, actingUser);
  }

  @Post(':purchaseOrderId/decisions')
  @ApiOperation({
    summary: 'Approve or reject the current level of a purchase order workflow',
  })
  @ApiParam({ name: 'purchaseOrderId', type: String, format: 'uuid' })
  @ApiBody({ type: RecordDecisionDto })
  @ApiResponse({ status: 201, description: 'Decision recorded' })
  @ApiResponse({ status: 400, description: 'Missing required comment' })
  @ApiResponse({
    status: 403,
    description: 'User is not an approver on the active level',
  })
  @ApiResponse({
    status: 409,
    description: 'Workflow already finalized or no active level',
  })
  recordDecision(
    @Param('purchaseOrderId', new ParseUUIDPipe({ version: '4' }))
    purchaseOrderId: string,
    @Body() dto: RecordDecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.recordDecisionUseCase.execute(
      purchaseOrderId,
      user.userId,
      dto,
    );
  }

  @Post(':purchaseOrderId/ln-sync/retry')
  @ApiOperation({
    summary: 'Retry sending the final decision to LN after a previous failure',
  })
  @ApiParam({ name: 'purchaseOrderId', type: String, format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Retry attempted' })
  @ApiResponse({ status: 409, description: 'LN sync is not in a FAILED state' })
  retryLnSync(
    @Param('purchaseOrderId', new ParseUUIDPipe({ version: '4' }))
    purchaseOrderId: string,
    @CurrentUser() actingUser: AuthenticatedUser,
  ) {
    return this.retryLnSyncUseCase.execute(purchaseOrderId, actingUser);
  }
}
