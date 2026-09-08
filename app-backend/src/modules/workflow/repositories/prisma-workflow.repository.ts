import { Injectable } from '@nestjs/common';
import {
  ApprovalDecision,
  ApprovalMode,
  LevelStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { WorkflowWithRelations } from '../types/workflow-with-relations';
import {
  CreateDecisionInput,
  CreateWorkflowInput,
  FindPendingWorkflowsCriteria,
  FindPendingWorkflowsResult,
  FindWorkflowsHistoryCriteria,
  FindWorkflowsHistoryResult,
  UpdateWorkflowInput,
  WorkflowRepository,
} from './workflow.repository';

const WORKFLOW_INCLUDE = {
  levels: {
    include: {
      approvers: {
        include: { user: { omit: { passwordHash: true } } },
      },
      decisions: true,
    },
    orderBy: { level: 'asc' },
  },
  purchaseOrder: { include: { company: true, lines: true } },
  rule: { select: { name: true, code: true } },
} satisfies Prisma.ApprovalWorkflowInclude;

// Used by findPending/findHistory: those return paginated summaries, not the
// full workflow detail, so only the fields actually read by the frontend
// mappers (toPendingPurchaseOrder/toHistoryPurchaseOrder) are fetched —
// approvers, decisions, auditEvents, PO lines and rule are left out on purpose.
const WORKFLOW_LIST_INCLUDE = {
  levels: { select: { levelId: true } },
  purchaseOrder: {
    select: {
      purchaseOrderId: true,
      orderNumber: true,
      supplierName: true,
      requesterName: true,
      totalAmount: true,
      costCenter: true,
      status: true,
      erpCreatedAt: true,
      company: { select: { name: true } },
    },
  },
} satisfies Prisma.ApprovalWorkflowInclude;

@Injectable()
export class PrismaWorkflowRepository implements WorkflowRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: CreateWorkflowInput): Promise<WorkflowWithRelations> {
    // A workflow being created has no trail yet.
    const workflow = await this.prismaService
      .getClient()
      .approvalWorkflow.create({
        data: {
          purchaseOrderId: input.purchaseOrderId,
          ruleId: input.ruleId,
          status: input.status,
          currentLevel: input.currentLevel,
          requireCommentOnApprove: input.requireCommentOnApprove,
          requireCommentOnReject: input.requireCommentOnReject,
          levels: {
            create: input.levels.map((level) => {
              const isActiveLevel = level.levelNumber === input.currentLevel;

              return {
                level: level.levelNumber,
                mode: level.mode,
                status: isActiveLevel ? 'PENDING' : 'LOCKED',
                startedAt: isActiveLevel ? new Date() : null,
                approvers: {
                  create: level.approverUserIds.map((userId, index) => ({
                    userId,
                    sequenceOrder: index + 1,
                    status: this.initialApproverStatus(
                      isActiveLevel,
                      level.mode,
                      index,
                    ),
                  })),
                },
              };
            }),
          },
        },
        include: WORKFLOW_INCLUDE,
      });

    return { ...workflow, auditEvents: [] };
  }

  // The audit trail no longer hangs off the workflow by FK, so the timeline is
  // fetched alongside it, keyed by (entity, entityId). The JSON shape returned
  // to the web client is unchanged.
  async findByPurchaseOrderId(
    purchaseOrderId: string,
  ): Promise<WorkflowWithRelations | null> {
    const client = this.prismaService.getClient();

    const [workflow, auditEvents] = await Promise.all([
      client.approvalWorkflow.findUnique({
        where: { purchaseOrderId },
        include: WORKFLOW_INCLUDE,
      }),
      client.auditEvent.findMany({
        where: { entity: 'PurchaseOrder', entityId: purchaseOrderId },
        select: {
          createdAt: true,
          message: true,
          severity: true,
          metadata: true,
          action: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return workflow ? { ...workflow, auditEvents } : null;
  }

  // Hot path for LN sync, which never reads the timeline: skip the extra query.
  async findById(workflowId: string): Promise<WorkflowWithRelations | null> {
    const workflow = await this.prismaService
      .getClient()
      .approvalWorkflow.findUnique({
        where: { workflowId },
        include: WORKFLOW_INCLUDE,
      });

    return workflow ? { ...workflow, auditEvents: [] } : null;
  }

  async findPending(
    criteria: FindPendingWorkflowsCriteria,
  ): Promise<FindPendingWorkflowsResult> {
    const where: Prisma.ApprovalWorkflowWhereInput = {
      status: 'PENDING',
      ...(criteria.userIds && {
        levels: {
          some: {
            status: 'PENDING',
            approvers: {
              some: { userId: { in: criteria.userIds }, status: 'PENDING' },
            },
          },
        },
      }),
      purchaseOrder: {
        ...(criteria.companyId && { companyId: criteria.companyId }),
        ...(criteria.companyIds && {
          companyId: { in: criteria.companyIds },
        }),
        ...(criteria.supplierCode && { supplierCode: criteria.supplierCode }),
        ...(criteria.requesterCode && {
          requesterCode: criteria.requesterCode,
        }),
        ...(criteria.costCenter && { costCenter: criteria.costCenter }),
        ...(criteria.search && {
          orderNumber: { contains: criteria.search, mode: 'insensitive' },
        }),
      },
    };

    const client = this.prismaService.getClient();

    const [items, total] = await Promise.all([
      client.approvalWorkflow.findMany({
        where,
        include: WORKFLOW_LIST_INCLUDE,
        skip: criteria.skip,
        take: criteria.take,
        orderBy: { purchaseOrder: { erpCreatedAt: 'asc' } },
      }),
      client.approvalWorkflow.count({ where }),
    ]);

    return { items, total };
  }

  async findHistory(
    criteria: FindWorkflowsHistoryCriteria,
  ): Promise<FindWorkflowsHistoryResult> {
    const where: Prisma.ApprovalWorkflowWhereInput = {
      purchaseOrder: {
        ...(criteria.companyId && { companyId: criteria.companyId }),
        ...(criteria.companyIds && {
          companyId: { in: criteria.companyIds },
        }),
        ...(criteria.status && { status: criteria.status }),
        ...(criteria.supplierCode && { supplierCode: criteria.supplierCode }),
        ...(criteria.requesterCode && {
          requesterCode: criteria.requesterCode,
        }),
        ...(criteria.costCenter && { costCenter: criteria.costCenter }),
        ...(criteria.search && {
          orderNumber: { contains: criteria.search, mode: 'insensitive' },
        }),
        ...((criteria.dateFrom || criteria.dateTo) && {
          erpCreatedAt: {
            ...(criteria.dateFrom && { gte: criteria.dateFrom }),
            ...(criteria.dateTo && { lte: criteria.dateTo }),
          },
        }),
      },
    };

    const client = this.prismaService.getClient();

    const [items, total] = await Promise.all([
      client.approvalWorkflow.findMany({
        where,
        include: WORKFLOW_LIST_INCLUDE,
        skip: criteria.skip,
        take: criteria.take,
        orderBy: { purchaseOrder: { erpCreatedAt: 'desc' } },
      }),
      client.approvalWorkflow.count({ where }),
    ]);

    return { items, total };
  }

  async createDecision(input: CreateDecisionInput): Promise<ApprovalDecision> {
    return this.prismaService.getClient().approvalDecision.create({
      data: {
        levelId: input.levelId,
        assignedUserId: input.assignedUserId,
        actingUserId: input.actingUserId,
        decision: input.decision,
        comment: input.comment,
      },
    });
  }

  async updateApproverStatus(
    levelId: string,
    userId: string,
    status: LevelStatus,
    decidedAt?: Date,
  ): Promise<void> {
    await this.prismaService.getClient().approvalWorkflowApprover.update({
      where: { levelId_userId: { levelId, userId } },
      data: { status, decidedAt },
    });
  }

  async updateLevelStatus(
    levelId: string,
    data: { status: LevelStatus; startedAt?: Date; completedAt?: Date },
  ): Promise<void> {
    await this.prismaService.getClient().approvalWorkflowLevel.update({
      where: { levelId },
      data,
    });
  }

  async activateLevel(levelId: string, mode: ApprovalMode): Promise<void> {
    const client = this.prismaService.getClient();

    await client.approvalWorkflowLevel.update({
      where: { levelId },
      data: { status: 'PENDING', startedAt: new Date() },
    });

    if (mode === 'SEQUENTIAL') {
      const firstApprover = await client.approvalWorkflowApprover.findFirst({
        where: { levelId },
        orderBy: { sequenceOrder: 'asc' },
      });

      if (firstApprover) {
        await client.approvalWorkflowApprover.update({
          where: {
            levelId_userId: { levelId, userId: firstApprover.userId },
          },
          data: { status: 'PENDING' },
        });
      }
    } else {
      await client.approvalWorkflowApprover.updateMany({
        where: { levelId },
        data: { status: 'PENDING' },
      });
    }
  }

  async unlockNextApprover(
    levelId: string,
    afterSequenceOrder: number,
  ): Promise<void> {
    const client = this.prismaService.getClient();
    const next = await client.approvalWorkflowApprover.findFirst({
      where: { levelId, sequenceOrder: afterSequenceOrder + 1 },
    });

    if (next) {
      await client.approvalWorkflowApprover.update({
        where: { levelId_userId: { levelId, userId: next.userId } },
        data: { status: 'PENDING' },
      });
    }
  }

  // Callers only read scalar fields off the result, so the trail is not
  // re-fetched here.
  async updateWorkflow(
    workflowId: string,
    data: UpdateWorkflowInput,
  ): Promise<WorkflowWithRelations> {
    const workflow = await this.prismaService
      .getClient()
      .approvalWorkflow.update({
        where: { workflowId },
        data,
        include: WORKFLOW_INCLUDE,
      });

    return { ...workflow, auditEvents: [] };
  }

  async updatePurchaseOrderStatus(
    purchaseOrderId: string,
    status: Prisma.PurchaseOrderUpdateInput['status'],
  ): Promise<void> {
    await this.prismaService.getClient().purchaseOrder.update({
      where: { purchaseOrderId },
      data: { status },
    });
  }

  private initialApproverStatus(
    isActiveLevel: boolean,
    mode: ApprovalMode,
    index: number,
  ): LevelStatus {
    if (!isActiveLevel) {
      return 'LOCKED';
    }

    if (mode === 'SEQUENTIAL') {
      return index === 0 ? 'PENDING' : 'LOCKED';
    }

    return 'PENDING';
  }
}
