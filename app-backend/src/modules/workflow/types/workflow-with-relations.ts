import {
  ApprovalDecision,
  ApprovalWorkflow,
  ApprovalWorkflowApprover,
  ApprovalWorkflowLevel,
  Company,
  PurchaseOrder,
  PurchaseOrderLine,
  User,
  WorkflowAuditEvent,
} from '@prisma/client';

export type ApprovalWorkflowApproverWithUser = ApprovalWorkflowApprover & {
  user: Omit<User, 'passwordHash'>;
};

export type ApprovalWorkflowLevelWithRelations = ApprovalWorkflowLevel & {
  approvers: ApprovalWorkflowApproverWithUser[];
  decisions: ApprovalDecision[];
};

export type WorkflowWithRelations = ApprovalWorkflow & {
  levels: ApprovalWorkflowLevelWithRelations[];
  auditEvents: WorkflowAuditEvent[];
  purchaseOrder: PurchaseOrder & {
    company: Company;
    lines: PurchaseOrderLine[];
  };
  rule: { name: string; code: string } | null;
};

// Lightweight shape for paginated list endpoints (findPending/findHistory) —
// callers only ever read scalar purchaseOrder fields and levels.length, so
// approvers/decisions/auditEvents/lines/rule are deliberately left out to
// avoid over-fetching on every page load.
export type WorkflowListItem = Pick<ApprovalWorkflow, 'currentLevel'> & {
  levels: { levelId: string }[];
  purchaseOrder: Pick<
    PurchaseOrder,
    | 'purchaseOrderId'
    | 'orderNumber'
    | 'supplierName'
    | 'requesterName'
    | 'totalAmount'
    | 'costCenter'
    | 'status'
    | 'erpCreatedAt'
  > & {
    company: Pick<Company, 'name'>;
  };
};
