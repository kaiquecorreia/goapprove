import {
  ApprovalWorkflowApproverWithUser,
  WorkflowWithRelations,
} from '../types/workflow-with-relations';
import { LnApprovalResultPayload, LnDecision } from './ln-api-client';

// The LN return contract is still subject to change on the LN side, so the
// whole Portal -> LN mapping lives here and nowhere else.

type DecidedApprover = ApprovalWorkflowApproverWithUser & {
  status: LnDecision;
};

function hasDecided(
  approver: ApprovalWorkflowApproverWithUser,
): approver is DecidedApprover {
  return approver.status === 'APPROVED' || approver.status === 'REJECTED';
}

export function buildLnApprovalResult(
  workflow: WorkflowWithRelations,
): LnApprovalResultPayload {
  const { purchaseOrder } = workflow;
  const decision: LnDecision =
    workflow.status === 'APPROVED' ? 'APPROVED' : 'REJECTED';

  return {
    companyCode: purchaseOrder.company.externalIntegrationCode,
    requestId: purchaseOrder.requestId,
    batchId: purchaseOrder.batchId,
    purchaseOrderNumber: purchaseOrder.orderNumber,
    decision,
    decisionDate: (workflow.finalizedAt ?? new Date()).toISOString(),
    finalStatusPortal: decision,
    // A substitute's decision is recorded against the assigned approver, so
    // the approver reported to LN is always the one the rule assigned.
    approvers: workflow.levels.flatMap((level) =>
      level.approvers.filter(hasDecided).map((approver) => {
        const matchingDecision = level.decisions.find(
          (d) => d.assignedUserId === approver.userId,
        );

        return {
          level: level.level,
          userId: approver.userId,
          lnUserId: approver.user.externalIntegrationUser,
          name: approver.user.name,
          decision: approver.status,
          decisionDate: (approver.decidedAt ?? new Date()).toISOString(),
          // LN's ApprovalResponse action rejects a null comment, so an
          // approval made without one is sent as an empty string.
          comment: matchingDecision?.comment ?? '',
        };
      }),
    ),
  };
}
