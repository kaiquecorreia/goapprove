import {
  ApprovalDecision,
  ApprovalMode,
  DecisionType,
  LevelStatus,
  LnSyncStatus,
  PurchaseOrderStatus,
  WorkflowStatus,
} from '@prisma/client';

import {
  WorkflowListItem,
  WorkflowWithRelations,
} from '../types/workflow-with-relations';

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

export interface UpdateWorkflowInput {
  status?: WorkflowStatus;
  currentLevel?: number | null;
  finalizedAt?: Date | null;
  lnSyncStatus?: LnSyncStatus;
  lnSyncAttempts?: number;
  lnLastError?: string | null;
  lnSyncedAt?: Date | null;
}

export interface FindPendingWorkflowsCriteria {
  // Omitted => no per-user restriction (company-wide view, for OWNER/ADMINISTRATOR).
  userIds?: string[];
  skip: number;
  take: number;
  search?: string;
  companyId?: string;
  companyIds?: string[];
  supplierCode?: string;
  requesterCode?: string;
  costCenter?: string;
}

export interface FindPendingWorkflowsResult {
  items: WorkflowListItem[];
  total: number;
}

export interface FindWorkflowsHistoryCriteria {
  // Omitted => no company restriction (ADMINISTRATOR, unrestricted).
  companyId?: string;
  companyIds?: string[];
  skip: number;
  take: number;
  search?: string;
  status?: PurchaseOrderStatus;
  supplierCode?: string;
  requesterCode?: string;
  costCenter?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface FindWorkflowsHistoryResult {
  items: WorkflowListItem[];
  total: number;
}

export abstract class WorkflowRepository {
  abstract create(input: CreateWorkflowInput): Promise<WorkflowWithRelations>;
  abstract findByPurchaseOrderId(
    purchaseOrderId: string,
  ): Promise<WorkflowWithRelations | null>;
  abstract findById(workflowId: string): Promise<WorkflowWithRelations | null>;
  abstract findPending(
    criteria: FindPendingWorkflowsCriteria,
  ): Promise<FindPendingWorkflowsResult>;
  abstract findHistory(
    criteria: FindWorkflowsHistoryCriteria,
  ): Promise<FindWorkflowsHistoryResult>;

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
  abstract updatePurchaseOrderStatus(
    purchaseOrderId: string,
    status: PurchaseOrderStatus,
  ): Promise<void>;
}
