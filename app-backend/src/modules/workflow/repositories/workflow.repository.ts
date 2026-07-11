import {
  ApprovalDecision,
  ApprovalMode,
  DecisionType,
  LevelStatus,
  LnSyncStatus,
  PurchaseOrderStatus,
  WorkflowStatus,
} from '@prisma/client';

import { WorkflowWithRelations } from '../types/workflow-with-relations';

export interface CreateWorkflowLevelInput {
  levelNumber: number;
  mode: ApprovalMode;
  approverUserIds: string[];
}

export interface CreateWorkflowInput {
  purchaseOrderId: string;
  ruleId: string | null;
  status: WorkflowStatus;
  currentLevel: number | null;
  requireCommentOnApprove: boolean;
  requireCommentOnReject: boolean;
  levels: CreateWorkflowLevelInput[];
}

export interface CreateDecisionInput {
  levelId: string;
  assignedUserId: string;
  actingUserId: string;
  decision: DecisionType;
  comment?: string;
}

export interface CreateAuditEventInput {
  workflowId: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  actorUserId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateWorkflowInput {
  status?: WorkflowStatus;
  currentLevel?: number | null;
  finalizedAt?: Date | null;
  lnSyncStatus?: LnSyncStatus;
  lnSyncAttempts?: number;
  lnLastError?: string | null;
  lnSyncedAt?: Date | null;
}

export abstract class WorkflowRepository {
  abstract create(input: CreateWorkflowInput): Promise<WorkflowWithRelations>;
  abstract findByPurchaseOrderId(
    purchaseOrderId: string,
  ): Promise<WorkflowWithRelations | null>;
  abstract findById(workflowId: string): Promise<WorkflowWithRelations | null>;
  abstract findPendingForUsers(
    userIds: string[],
  ): Promise<WorkflowWithRelations[]>;

  abstract createDecision(
    input: CreateDecisionInput,
  ): Promise<ApprovalDecision>;
  abstract updateApproverStatus(
    levelId: string,
    userId: string,
    status: LevelStatus,
    decidedAt?: Date,
  ): Promise<void>;
  abstract updateLevelStatus(
    levelId: string,
    data: { status: LevelStatus; startedAt?: Date; completedAt?: Date },
  ): Promise<void>;
  abstract activateLevel(levelId: string, mode: ApprovalMode): Promise<void>;
  abstract unlockNextApprover(
    levelId: string,
    afterSequenceOrder: number,
  ): Promise<void>;
  abstract updateWorkflow(
    workflowId: string,
    data: UpdateWorkflowInput,
  ): Promise<WorkflowWithRelations>;
  abstract addAuditEvent(input: CreateAuditEventInput): Promise<void>;
  abstract updatePurchaseOrderStatus(
    purchaseOrderId: string,
    status: PurchaseOrderStatus,
  ): Promise<void>;
}
