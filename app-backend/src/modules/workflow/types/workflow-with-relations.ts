import {
  ApprovalDecision,
  ApprovalWorkflow,
  ApprovalWorkflowApprover,
  ApprovalWorkflowLevel,
  Company,
  PurchaseOrder,
  User,
  WorkflowAuditEvent,
} from '@prisma/client';

export type ApprovalWorkflowApproverWithUser = ApprovalWorkflowApprover & {
  user: User;
};

export type ApprovalWorkflowLevelWithRelations = ApprovalWorkflowLevel & {
  approvers: ApprovalWorkflowApproverWithUser[];
  decisions: ApprovalDecision[];
};

export type WorkflowWithRelations = ApprovalWorkflow & {
  levels: ApprovalWorkflowLevelWithRelations[];
  auditEvents: WorkflowAuditEvent[];
  purchaseOrder: PurchaseOrder & { company: Company };
};
