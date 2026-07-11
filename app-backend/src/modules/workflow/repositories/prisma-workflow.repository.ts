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
  CreateAuditEventInput,
  CreateDecisionInput,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowRepository,
} from './workflow.repository';

const WORKFLOW_INCLUDE = {
  levels: {
    include: {
      approvers: { include: { user: true } },
      decisions: true,
    },
    orderBy: { level: 'asc' },
  },
  auditEvents: { orderBy: { createdAt: 'asc' } },
  purchaseOrder: { include: { company: true } },
} satisfies Prisma.ApprovalWorkflowInclude;

@Injectable()
export class PrismaWorkflowRepository implements WorkflowRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(input: CreateWorkflowInput): Promise<WorkflowWithRelations> {
    return this.prismaService.getClient().approvalWorkflow.create({
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
  }

  async findByPurchaseOrderId(
    purchaseOrderId: string,
  ): Promise<WorkflowWithRelations | null> {
    return this.prismaService.getClient().approvalWorkflow.findUnique({
      where: { purchaseOrderId },
      include: WORKFLOW_INCLUDE,
    });
  }

  async findById(workflowId: string): Promise<WorkflowWithRelations | null> {
    return this.prismaService.getClient().approvalWorkflow.findUnique({
      where: { workflowId },
      include: WORKFLOW_INCLUDE,
    });
  }

  async findPendingForUsers(
    userIds: string[],
  ): Promise<WorkflowWithRelations[]> {
    return this.prismaService.getClient().approvalWorkflow.findMany({
      where: {
        status: 'PENDING',
        levels: {
          some: {
            status: 'PENDING',
            approvers: {
              some: { userId: { in: userIds }, status: 'PENDING' },
            },
          },
        },
      },
      include: WORKFLOW_INCLUDE,
    });
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

  async updateWorkflow(
    workflowId: string,
    data: UpdateWorkflowInput,
  ): Promise<WorkflowWithRelations> {
    return this.prismaService.getClient().approvalWorkflow.update({
      where: { workflowId },
      data,
      include: WORKFLOW_INCLUDE,
    });
  }

  async addAuditEvent(input: CreateAuditEventInput): Promise<void> {
    await this.prismaService.getClient().workflowAuditEvent.create({
      data: {
        workflowId: input.workflowId,
        type: input.type,
        severity: input.severity,
        actorUserId: input.actorUserId,
        message: input.message,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
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
