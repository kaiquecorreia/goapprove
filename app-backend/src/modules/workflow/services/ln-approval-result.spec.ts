import { WorkflowWithRelations } from '../types/workflow-with-relations';
import { buildLnApprovalResult } from './ln-approval-result';

const FINALIZED_AT = new Date('2026-06-16T17:22:10.000Z');

function buildApprover(
  userId: string,
  lnUserId: string,
  name: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    levelId: 'level-1',
    userId,
    sequenceOrder: 1,
    status: 'PENDING',
    decidedAt: null,
    user: { userId, name, externalIntegrationUser: lnUserId },
    ...overrides,
  };
}

function buildDecision(
  assignedUserId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    decisionId: `decision-${assignedUserId}`,
    levelId: 'level-1',
    assignedUserId,
    actingUserId: assignedUserId,
    decision: 'APPROVED',
    comment: null,
    decidedAt: FINALIZED_AT,
    ...overrides,
  };
}

function buildLevel(level: number, overrides: Record<string, unknown> = {}) {
  return {
    levelId: `level-${level}`,
    workflowId: 'workflow-1',
    level,
    mode: 'ANY',
    status: 'APPROVED',
    approvers: [],
    decisions: [],
    ...overrides,
  };
}

function buildWorkflow(
  overrides: Record<string, unknown> = {},
): WorkflowWithRelations {
  return {
    workflowId: 'workflow-1',
    purchaseOrderId: 'po-1',
    status: 'APPROVED',
    finalizedAt: FINALIZED_AT,
    levels: [],
    auditEvents: [],
    purchaseOrder: {
      companyId: 'company-1',
      orderNumber: 'OC000001',
      requestId: 'CKX-001-000001651-000001',
      batchId: 'CKX-001-20260924-00001',
      company: { externalIntegrationCode: '001' },
    },
    ...overrides,
  } as unknown as WorkflowWithRelations;
}

describe('buildLnApprovalResult', () => {
  it('echoes requestId/batchId and lists every approver of an approved multi-level workflow', () => {
    const workflow = buildWorkflow({
      levels: [
        buildLevel(1, {
          approvers: [
            buildApprover('USR001', 'jsilva', 'João Silva', {
              status: 'APPROVED',
              decidedAt: new Date('2026-06-16T16:10:00.000Z'),
            }),
          ],
          decisions: [
            buildDecision('USR001', {
              comment: 'Aprovado conforme orçamento.',
            }),
          ],
        }),
        buildLevel(2, {
          approvers: [
            buildApprover('USR009', 'msantos', 'Maria Santos', {
              status: 'APPROVED',
              decidedAt: FINALIZED_AT,
            }),
          ],
          decisions: [
            buildDecision('USR009', { comment: 'Aprovado pela diretoria.' }),
          ],
        }),
      ],
    });

    expect(buildLnApprovalResult(workflow)).toEqual({
      companyCode: '001',
      requestId: 'CKX-001-000001651-000001',
      batchId: 'CKX-001-20260924-00001',
      purchaseOrderNumber: 'OC000001',
      decision: 'APPROVED',
      decisionDate: '2026-06-16T17:22:10.000Z',
      finalStatusPortal: 'APPROVED',
      approvers: [
        {
          level: 1,
          userId: 'USR001',
          lnUserId: 'jsilva',
          name: 'João Silva',
          decision: 'APPROVED',
          decisionDate: '2026-06-16T16:10:00.000Z',
          comment: 'Aprovado conforme orçamento.',
        },
        {
          level: 2,
          userId: 'USR009',
          lnUserId: 'msantos',
          name: 'Maria Santos',
          decision: 'APPROVED',
          decisionDate: '2026-06-16T17:22:10.000Z',
          comment: 'Aprovado pela diretoria.',
        },
      ],
    });
  });

  it('reports a rejection in the same format and leaves out approvers who never decided', () => {
    const workflow = buildWorkflow({
      status: 'REJECTED',
      levels: [
        buildLevel(1, {
          approvers: [
            buildApprover('USR001', 'jsilva', 'João Silva', {
              status: 'APPROVED',
              decidedAt: new Date('2026-06-16T16:10:00.000Z'),
            }),
          ],
          decisions: [buildDecision('USR001')],
        }),
        buildLevel(2, {
          status: 'REJECTED',
          mode: 'ALL',
          approvers: [
            buildApprover('USR009', 'msantos', 'Maria Santos', {
              status: 'REJECTED',
              decidedAt: FINALIZED_AT,
            }),
            buildApprover('USR010', 'plima', 'Paulo Lima', {
              status: 'PENDING',
            }),
          ],
          decisions: [
            buildDecision('USR009', {
              decision: 'REJECTED',
              comment: 'Fora do orçamento.',
            }),
          ],
        }),
        buildLevel(3, {
          status: 'LOCKED',
          approvers: [
            buildApprover('USR020', 'acosta', 'Ana Costa', {
              status: 'LOCKED',
            }),
          ],
        }),
      ],
    });

    const result = buildLnApprovalResult(workflow);

    expect(result.decision).toBe('REJECTED');
    expect(result.finalStatusPortal).toBe('REJECTED');
    expect(result.approvers).toEqual([
      expect.objectContaining({
        level: 1,
        lnUserId: 'jsilva',
        decision: 'APPROVED',
        comment: '',
      }),
      expect.objectContaining({
        level: 2,
        lnUserId: 'msantos',
        decision: 'REJECTED',
        comment: 'Fora do orçamento.',
      }),
    ]);
  });

  it('sends an empty approvers list when a rule auto-approved the order', () => {
    const result = buildLnApprovalResult(buildWorkflow({ levels: [] }));

    expect(result.decision).toBe('APPROVED');
    expect(result.approvers).toEqual([]);
  });

  it('reports the assigned approver when a substitute made the decision', () => {
    const workflow = buildWorkflow({
      levels: [
        buildLevel(1, {
          approvers: [
            buildApprover('USR001', 'jsilva', 'João Silva', {
              status: 'APPROVED',
              decidedAt: FINALIZED_AT,
            }),
          ],
          decisions: [
            buildDecision('USR001', {
              actingUserId: 'USR050',
              comment: 'Aprovado em substituição.',
            }),
          ],
        }),
      ],
    });

    expect(buildLnApprovalResult(workflow).approvers).toEqual([
      expect.objectContaining({
        userId: 'USR001',
        lnUserId: 'jsilva',
        name: 'João Silva',
        comment: 'Aprovado em substituição.',
      }),
    ]);
  });
});
