import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalMode, LevelStatus } from '@prisma/client';

import { UserRepository } from '../../user/repositories/user.repository';
import { CompanyAccessService } from '../../company/services/company-access.service';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { MatchedRuleResult } from '../../rule/types/matched-rule-result';
import { ListPendingWorkflowsDto } from '../dtos/list-pending-workflows.dto';
import {
  FindPendingWorkflowsResult,
  WorkflowRepository,
} from '../repositories/workflow.repository';
import { RecordDecisionInput } from '../types/record-decision-input';
import {
  ApprovalWorkflowApproverWithUser,
  ApprovalWorkflowLevelWithRelations,
  WorkflowWithRelations,
} from '../types/workflow-with-relations';
import { LnSyncService } from './ln-sync.service';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly userRepository: UserRepository,
    private readonly transactionService: TransactionService,
    private readonly lnSyncService: LnSyncService,
    private readonly companyAccessService: CompanyAccessService,
  ) {}

  async startWorkflow(
    purchaseOrderId: string,
    ruleMatch: MatchedRuleResult | null,
  ): Promise<WorkflowWithRelations> {
    return this.transactionService.run(async () => {
      if (!ruleMatch) {
        const workflow = await this.workflowRepository.create({
          purchaseOrderId,
          ruleId: null,
          status: 'NO_RULE',
          currentLevel: null,
          requireCommentOnApprove: false,
          requireCommentOnReject: true,
          levels: [],
        });

        await this.workflowRepository.addAuditEvent({
          workflowId: workflow.workflowId,
          type: 'NO_RULE_MATCHED',
          severity: 'warning',
          message:
            'No active rule matched this purchase order; manual assignment required.',
        });

        await this.workflowRepository.updatePurchaseOrderStatus(
          purchaseOrderId,
          'NO_RULE',
        );

        return workflow;
      }

      const firstLevel = ruleMatch.levels[0]?.levelNumber ?? 1;

      const workflow = await this.workflowRepository.create({
        purchaseOrderId,
        ruleId: ruleMatch.rule.ruleId,
        status: 'PENDING',
        currentLevel: firstLevel,
        requireCommentOnApprove: false,
        requireCommentOnReject: true,
        levels: ruleMatch.levels.map((level) => ({
          levelNumber: level.levelNumber,
          mode: level.mode,
          approverUserIds: level.approverUserIds,
        })),
      });

      await this.workflowRepository.addAuditEvent({
        workflowId: workflow.workflowId,
        type: 'RULE_APPLIED',
        severity: 'info',
        message: `Rule "${ruleMatch.rule.name}" (${ruleMatch.rule.code}) matched and applied.`,
        metadata: {
          ruleId: ruleMatch.rule.ruleId,
          conflictedWith: ruleMatch.conflictedWith,
        },
      });

      return workflow;
    });
  }

  // Raw lookup, no authorization — reused internally by recordDecision (already
  // authorized via resolveActingApprover) and by the public, checked entry points below.
  private async fetchByPurchaseOrderId(
    purchaseOrderId: string,
  ): Promise<WorkflowWithRelations> {
    const workflow =
      await this.workflowRepository.findByPurchaseOrderId(purchaseOrderId);

    if (!workflow) {
      throw new NotFoundException(
        `No workflow found for purchase order ${purchaseOrderId}`,
      );
    }

    return workflow;
  }

  async findByPurchaseOrderId(
    purchaseOrderId: string,
    actingUser: AuthenticatedUser,
  ): Promise<WorkflowWithRelations> {
    const workflow = await this.fetchByPurchaseOrderId(purchaseOrderId);

    await this.companyAccessService.assertCompanyAccess(actingUser, [
      workflow.purchaseOrder.companyId,
    ]);

    return workflow;
  }

  async findPending(
    user: AuthenticatedUser,
    query: ListPendingWorkflowsDto,
  ): Promise<FindPendingWorkflowsResult & { page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filters = {
      search: query.search,
      supplierCode: query.supplierCode,
      requesterCode: query.requesterCode,
      costCenter: query.costCenter,
    };

    const isCompanyWideViewer =
      user.role === 'OWNER' || user.role === 'ADMINISTRATOR';

    let result: FindPendingWorkflowsResult;

    if (isCompanyWideViewer) {
      // Supervisory view: every pending PO in the company, not just their own approvals.
      const accessibleCompanyIds =
        await this.companyAccessService.getAccessibleCompanyIds(user);

      if (accessibleCompanyIds === null) {
        // ADMINISTRATOR — unrestricted, same behavior as before.
        result = await this.workflowRepository.findPending({
          companyId: query.companyId,
          skip: (page - 1) * limit,
          take: limit,
          ...filters,
        });
      } else {
        if (
          query.companyId &&
          !accessibleCompanyIds.includes(query.companyId)
        ) {
          throw new ForbiddenException(
            'You do not have access to this resource',
          );
        }

        result = await this.workflowRepository.findPending({
          companyIds: query.companyId
            ? [query.companyId]
            : accessibleCompanyIds,
          skip: (page - 1) * limit,
          take: limit,
          ...filters,
        });
      }
    } else {
      const currentUser = await this.userRepository.findById(user.userId);
      const substitutedForIds = (currentUser?.substitutedBy ?? []).map(
        (s) => s.userId,
      );

      result = await this.workflowRepository.findPending({
        userIds: [user.userId, ...substitutedForIds],
        skip: (page - 1) * limit,
        take: limit,
        ...filters,
      });
    }

    return { ...result, page, limit };
  }

  async recordDecision(
    input: RecordDecisionInput,
  ): Promise<WorkflowWithRelations> {
    const finalized = await this.transactionService.run(async () => {
      const workflow = await this.workflowRepository.findByPurchaseOrderId(
        input.purchaseOrderId,
      );

      if (!workflow) {
        throw new NotFoundException(
          `No workflow found for purchase order ${input.purchaseOrderId}`,
        );
      }

      if (workflow.status !== 'PENDING') {
        throw new ConflictException(
          `Workflow is already finalized (status: ${workflow.status})`,
        );
      }

      const currentLevel = workflow.levels.find(
        (level) => level.level === workflow.currentLevel,
      );

      if (!currentLevel) {
        throw new ConflictException('No active approval level');
      }

      const assignedUserId = await this.resolveActingApprover(
        currentLevel.approvers,
        input.actingUserId,
        input.onBehalfOfUserId,
      );

      const requiresComment =
        (input.decision === 'REJECTED' && workflow.requireCommentOnReject) ||
        (input.decision === 'APPROVED' && workflow.requireCommentOnApprove);

      if (requiresComment && !input.comment?.trim()) {
        throw new BadRequestException('Comment is required for this decision');
      }

      const now = new Date();

      await this.workflowRepository.createDecision({
        levelId: currentLevel.levelId,
        assignedUserId,
        actingUserId: input.actingUserId,
        decision: input.decision,
        comment: input.comment,
      });

      const approverStatus: LevelStatus =
        input.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';

      await this.workflowRepository.updateApproverStatus(
        currentLevel.levelId,
        assignedUserId,
        approverStatus,
        now,
      );

      await this.workflowRepository.addAuditEvent({
        workflowId: workflow.workflowId,
        type: 'DECISION_RECORDED',
        severity: input.decision === 'APPROVED' ? 'success' : 'warning',
        actorUserId: input.actingUserId,
        message: `${input.decision} recorded on level ${currentLevel.level}`,
        metadata: { assignedUserId, levelId: currentLevel.levelId },
      });

      if (input.decision === 'REJECTED') {
        await this.finalizeWorkflow(workflow, currentLevel, 'REJECTED', now);
        return true;
      }

      const decidedApprover = currentLevel.approvers.find(
        (approver) => approver.userId === assignedUserId,
      );
      const updatedApprovers = currentLevel.approvers.map((approver) =>
        approver.userId === assignedUserId
          ? { ...approver, status: approverStatus, decidedAt: now }
          : approver,
      );

      if (this.isLevelCleared(currentLevel.mode, updatedApprovers)) {
        await this.workflowRepository.updateLevelStatus(currentLevel.levelId, {
          status: 'APPROVED',
          completedAt: now,
        });

        const nextLevel = workflow.levels.find(
          (level) => level.level === currentLevel.level + 1,
        );

        if (nextLevel) {
          await this.workflowRepository.activateLevel(
            nextLevel.levelId,
            nextLevel.mode,
          );
          await this.workflowRepository.updateWorkflow(workflow.workflowId, {
            currentLevel: nextLevel.level,
          });
          await this.workflowRepository.addAuditEvent({
            workflowId: workflow.workflowId,
            type: 'LEVEL_UNLOCKED',
            severity: 'info',
            message: `Level ${nextLevel.level} unlocked`,
          });

          return false;
        }

        await this.finalizeWorkflow(workflow, currentLevel, 'APPROVED', now);
        return true;
      }

      if (currentLevel.mode === 'SEQUENTIAL' && decidedApprover) {
        await this.workflowRepository.unlockNextApprover(
          currentLevel.levelId,
          decidedApprover.sequenceOrder,
        );
      }

      return false;
    });

    const result = await this.fetchByPurchaseOrderId(input.purchaseOrderId);

    if (finalized) {
      await this.lnSyncService.sendResult(result.workflowId);
      return this.fetchByPurchaseOrderId(input.purchaseOrderId);
    }

    return result;
  }

  async retryLnSync(
    purchaseOrderId: string,
    actingUser: AuthenticatedUser,
  ): Promise<WorkflowWithRelations> {
    const workflow = await this.fetchByPurchaseOrderId(purchaseOrderId);

    await this.companyAccessService.assertCompanyAccess(actingUser, [
      workflow.purchaseOrder.companyId,
    ]);

    if (workflow.lnSyncStatus !== 'FAILED') {
      throw new ConflictException(
        `LN sync is not in a FAILED state (current: ${workflow.lnSyncStatus})`,
      );
    }

    await this.lnSyncService.sendResult(workflow.workflowId);

    return this.fetchByPurchaseOrderId(purchaseOrderId);
  }

  private async finalizeWorkflow(
    workflow: WorkflowWithRelations,
    level: ApprovalWorkflowLevelWithRelations,
    outcome: 'APPROVED' | 'REJECTED',
    now: Date,
  ): Promise<void> {
    if (outcome === 'REJECTED') {
      await this.workflowRepository.updateLevelStatus(level.levelId, {
        status: 'REJECTED',
        completedAt: now,
      });
    }

    await this.workflowRepository.updateWorkflow(workflow.workflowId, {
      status: outcome,
      currentLevel: null,
      finalizedAt: now,
      lnSyncStatus: 'PENDING',
    });

    await this.workflowRepository.addAuditEvent({
      workflowId: workflow.workflowId,
      type: outcome === 'APPROVED' ? 'WORKFLOW_APPROVED' : 'WORKFLOW_REJECTED',
      severity: outcome === 'APPROVED' ? 'success' : 'error',
      message: `Workflow finalized as ${outcome}`,
    });

    await this.workflowRepository.updatePurchaseOrderStatus(
      workflow.purchaseOrderId,
      outcome,
    );
  }

  private isLevelCleared(
    mode: ApprovalMode,
    approvers: Array<{ status: LevelStatus }>,
  ): boolean {
    if (mode === 'ANY') {
      return approvers.some((approver) => approver.status === 'APPROVED');
    }

    // ALL and SEQUENTIAL both require every approver to have approved;
    // SEQUENTIAL reaches this state only once approvers cleared in order,
    // since each is unlocked only after the previous one approves.
    return approvers.every((approver) => approver.status === 'APPROVED');
  }

  private async resolveActingApprover(
    approvers: ApprovalWorkflowApproverWithUser[],
    actingUserId: string,
    onBehalfOfUserId?: string,
  ): Promise<string> {
    const direct = approvers.find(
      (approver) =>
        approver.userId === actingUserId && approver.status === 'PENDING',
    );

    if (direct) {
      return direct.userId;
    }

    const actingUser = await this.userRepository.findById(actingUserId);
    const substitutedForIds = new Set(
      (actingUser?.substitutedBy ?? []).map((s) => s.userId),
    );

    const candidates = approvers.filter(
      (approver) =>
        approver.status === 'PENDING' && substitutedForIds.has(approver.userId),
    );

    if (candidates.length === 0) {
      throw new ForbiddenException(
        'User is not an approver on the active level, nor a substitute of one',
      );
    }

    if (onBehalfOfUserId) {
      const match = candidates.find(
        (candidate) => candidate.userId === onBehalfOfUserId,
      );

      if (!match) {
        throw new ForbiddenException(
          `User is not a registered substitute for ${onBehalfOfUserId} on the active level`,
        );
      }

      return match.userId;
    }

    if (candidates.length > 1) {
      throw new ConflictException(
        `Ambiguous substitution: caller substitutes for multiple pending approvers (${candidates
          .map((candidate) => candidate.userId)
          .join(', ')}). Specify onBehalfOfUserId.`,
      );
    }

    return candidates[0].userId;
  }
}
