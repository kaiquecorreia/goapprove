import { LnSyncService } from './ln-sync.service';
import { WorkflowService } from './workflow.service';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { UserRepository } from '../../user/repositories/user.repository';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { WorkflowWithRelations } from '../types/workflow-with-relations';

function buildApprover(overrides: Record<string, unknown> = {}) {
  return {
    levelId: 'level-1',
    userId: 'approverA',
    sequenceOrder: 1,
    status: 'PENDING',
    decidedAt: null,
    user: { userId: 'approverA', externalIntegrationUser: 'APPROVER_A' },
    ...overrides,
  };
}

function buildLevel(overrides: Record<string, unknown> = {}) {
  return {
    levelId: 'level-1',
    workflowId: 'workflow-1',
    level: 1,
    mode: 'ANY',
    status: 'PENDING',
    approvers: [buildApprover()],
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
    status: 'PENDING',
    currentLevel: 1,
    requireCommentOnApprove: false,
    requireCommentOnReject: true,
    lnSyncStatus: 'NOT_APPLICABLE',
    levels: [buildLevel()],
    auditEvents: [],
    ...overrides,
  } as unknown as WorkflowWithRelations;
}

describe('WorkflowService', () => {
  let workflowRepository: jest.Mocked<WorkflowRepository>;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById'>>;
  let transactionService: { run: jest.Mock };
  let lnSyncService: jest.Mocked<Pick<LnSyncService, 'sendResult'>>;
  let service: WorkflowService;

  beforeEach(() => {
    workflowRepository = {
      create: jest.fn(),
      findByPurchaseOrderId: jest.fn(),
      findById: jest.fn(),
      findPendingForUsers: jest.fn(),
      createDecision: jest.fn(),
      updateApproverStatus: jest.fn(),
      updateLevelStatus: jest.fn(),
      activateLevel: jest.fn(),
      unlockNextApprover: jest.fn(),
      updateWorkflow: jest.fn(),
      addAuditEvent: jest.fn(),
      updatePurchaseOrderStatus: jest.fn(),
    };

    userRepository = { findById: jest.fn().mockResolvedValue(null) };
    transactionService = { run: jest.fn((fn: () => Promise<unknown>) => fn()) };
    lnSyncService = { sendResult: jest.fn().mockResolvedValue(undefined) };

    service = new WorkflowService(
      workflowRepository,
      userRepository as unknown as UserRepository,
      transactionService as unknown as TransactionService,
      lnSyncService as unknown as LnSyncService,
    );
  });

  describe('recordDecision', () => {
    it('ANY: uma aprovação libera o nível e desbloqueia o próximo', async () => {
      const workflow = buildWorkflow({
        levels: [
          buildLevel({ level: 1, mode: 'ANY' }),
          buildLevel({
            levelId: 'level-2',
            level: 2,
            mode: 'ALL',
            status: 'LOCKED',
            approvers: [
              buildApprover({
                levelId: 'level-2',
                userId: 'approverB',
                status: 'LOCKED',
              }),
            ],
          }),
        ],
      });
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(workflow);

      await service.recordDecision({
        purchaseOrderId: 'po-1',
        actingUserId: 'approverA',
        decision: 'APPROVED',
        comment: 'ok',
      });

      expect(workflowRepository.updateApproverStatus).toHaveBeenCalledWith(
        'level-1',
        'approverA',
        'APPROVED',
        expect.any(Date),
      );
      expect(workflowRepository.updateLevelStatus).toHaveBeenCalledWith(
        'level-1',
        {
          status: 'APPROVED',
          completedAt: expect.any(Date),
        },
      );
      expect(workflowRepository.activateLevel).toHaveBeenCalledWith(
        'level-2',
        'ALL',
      );
      expect(workflowRepository.updateWorkflow).toHaveBeenCalledWith(
        'workflow-1',
        {
          currentLevel: 2,
        },
      );
      expect(lnSyncService.sendResult).not.toHaveBeenCalled();
    });

    it('ALL: aprovação parcial não libera o nível', async () => {
      const workflow = buildWorkflow({
        levels: [
          buildLevel({
            mode: 'ALL',
            approvers: [
              buildApprover({ userId: 'approverA' }),
              buildApprover({ userId: 'approverB' }),
            ],
          }),
        ],
      });
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(workflow);

      await service.recordDecision({
        purchaseOrderId: 'po-1',
        actingUserId: 'approverA',
        decision: 'APPROVED',
        comment: 'ok',
      });

      expect(workflowRepository.updateLevelStatus).not.toHaveBeenCalled();
      expect(workflowRepository.updateWorkflow).not.toHaveBeenCalled();
      expect(lnSyncService.sendResult).not.toHaveBeenCalled();
    });

    it('ALL: última aprovação libera o nível e finaliza o workflow quando não há próximo nível', async () => {
      const workflow = buildWorkflow({
        levels: [
          buildLevel({
            mode: 'ALL',
            approvers: [
              buildApprover({ userId: 'approverA', status: 'APPROVED' }),
              buildApprover({ userId: 'approverB', status: 'PENDING' }),
            ],
          }),
        ],
      });
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(workflow);

      await service.recordDecision({
        purchaseOrderId: 'po-1',
        actingUserId: 'approverB',
        decision: 'APPROVED',
        comment: 'ok',
      });

      expect(workflowRepository.updateLevelStatus).toHaveBeenCalledWith(
        'level-1',
        {
          status: 'APPROVED',
          completedAt: expect.any(Date),
        },
      );
      expect(workflowRepository.updateWorkflow).toHaveBeenCalledWith(
        'workflow-1',
        {
          status: 'APPROVED',
          currentLevel: null,
          finalizedAt: expect.any(Date),
          lnSyncStatus: 'PENDING',
        },
      );
      expect(workflowRepository.updatePurchaseOrderStatus).toHaveBeenCalledWith(
        'po-1',
        'APPROVED',
      );
      expect(lnSyncService.sendResult).toHaveBeenCalledWith('workflow-1');
    });

    it('SEQUENTIAL: aprovar desbloqueia o próximo aprovador da sequência, sem liberar o nível', async () => {
      const workflow = buildWorkflow({
        levels: [
          buildLevel({
            mode: 'SEQUENTIAL',
            approvers: [
              buildApprover({
                userId: 'approverA',
                sequenceOrder: 1,
                status: 'PENDING',
              }),
              buildApprover({
                userId: 'approverB',
                sequenceOrder: 2,
                status: 'LOCKED',
              }),
            ],
          }),
        ],
      });
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(workflow);

      await service.recordDecision({
        purchaseOrderId: 'po-1',
        actingUserId: 'approverA',
        decision: 'APPROVED',
        comment: 'ok',
      });

      expect(workflowRepository.unlockNextApprover).toHaveBeenCalledWith(
        'level-1',
        1,
      );
      expect(workflowRepository.updateLevelStatus).not.toHaveBeenCalled();
      expect(lnSyncService.sendResult).not.toHaveBeenCalled();
    });

    it('REJECTED encerra o workflow imediatamente, independente do nível/modo', async () => {
      const workflow = buildWorkflow({
        levels: [
          buildLevel({
            mode: 'ALL',
            approvers: [
              buildApprover({ userId: 'approverA' }),
              buildApprover({ userId: 'approverB' }),
            ],
          }),
          buildLevel({ levelId: 'level-2', level: 2, status: 'LOCKED' }),
        ],
      });
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(workflow);

      await service.recordDecision({
        purchaseOrderId: 'po-1',
        actingUserId: 'approverA',
        decision: 'REJECTED',
        comment: 'Orçamento estourado',
      });

      expect(workflowRepository.updateLevelStatus).toHaveBeenCalledWith(
        'level-1',
        {
          status: 'REJECTED',
          completedAt: expect.any(Date),
        },
      );
      expect(workflowRepository.updateWorkflow).toHaveBeenCalledWith(
        'workflow-1',
        {
          status: 'REJECTED',
          currentLevel: null,
          finalizedAt: expect.any(Date),
          lnSyncStatus: 'PENDING',
        },
      );
      expect(workflowRepository.activateLevel).not.toHaveBeenCalled();
      expect(lnSyncService.sendResult).toHaveBeenCalledWith('workflow-1');
    });

    it('exige comentário na rejeição quando requireCommentOnReject é true (padrão)', async () => {
      const workflow = buildWorkflow();
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(workflow);

      await expect(
        service.recordDecision({
          purchaseOrderId: 'po-1',
          actingUserId: 'approverA',
          decision: 'REJECTED',
        }),
      ).rejects.toThrow('Comment is required for this decision');

      expect(workflowRepository.createDecision).not.toHaveBeenCalled();
    });

    it('rejeita quando o usuário não é aprovador do nível ativo nem substituto de um', async () => {
      const workflow = buildWorkflow();
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(workflow);
      userRepository.findById.mockResolvedValue({ substitutedBy: [] } as never);

      await expect(
        service.recordDecision({
          purchaseOrderId: 'po-1',
          actingUserId: 'random-user',
          decision: 'APPROVED',
          comment: 'ok',
        }),
      ).rejects.toThrow(
        'User is not an approver on the active level, nor a substitute of one',
      );
    });

    it('permite decisão de um substituto registrado agindo no lugar do aprovador titular', async () => {
      const workflow = buildWorkflow();
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(workflow);
      userRepository.findById.mockResolvedValue({
        substitutedBy: [
          { userId: 'approverA', substituteId: 'substituteX', priority: 1 },
        ],
      } as never);

      await service.recordDecision({
        purchaseOrderId: 'po-1',
        actingUserId: 'substituteX',
        decision: 'APPROVED',
        comment: 'Aprovando no lugar de A',
      });

      expect(workflowRepository.createDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedUserId: 'approverA',
          actingUserId: 'substituteX',
        }),
      );
    });

    it('rejeita ações em um workflow já finalizado', async () => {
      const workflow = buildWorkflow({ status: 'APPROVED' });
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(workflow);

      await expect(
        service.recordDecision({
          purchaseOrderId: 'po-1',
          actingUserId: 'approverA',
          decision: 'APPROVED',
          comment: 'ok',
        }),
      ).rejects.toThrow('Workflow is already finalized');
    });
  });

  describe('startWorkflow', () => {
    it('cria um workflow NO_RULE quando nenhuma regra casou', async () => {
      workflowRepository.create.mockResolvedValue(
        buildWorkflow({ status: 'NO_RULE' }),
      );

      await service.startWorkflow('po-1', null);

      expect(workflowRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'NO_RULE',
          ruleId: null,
          levels: [],
        }),
      );
      expect(workflowRepository.addAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'NO_RULE_MATCHED' }),
      );
      expect(workflowRepository.updatePurchaseOrderStatus).toHaveBeenCalledWith(
        'po-1',
        'NO_RULE',
      );
    });

    it('cria um workflow PENDING com os níveis da regra casada', async () => {
      workflowRepository.create.mockResolvedValue(buildWorkflow());

      await service.startWorkflow('po-1', {
        rule: { ruleId: 'rule-1', code: 'R1', name: 'Rule 1' },
        levels: [
          { levelNumber: 1, mode: 'ANY', approverUserIds: ['approverA'] },
        ],
        matchedAt: new Date(),
      });

      expect(workflowRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
          ruleId: 'rule-1',
          currentLevel: 1,
        }),
      );
      expect(workflowRepository.addAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'RULE_APPLIED' }),
      );
    });
  });

  describe('retryLnSync', () => {
    it('rejeita quando o status de sincronização não é FAILED', async () => {
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(
        buildWorkflow({ lnSyncStatus: 'SYNCED' }),
      );

      await expect(service.retryLnSync('po-1')).rejects.toThrow(
        'LN sync is not in a FAILED state',
      );
      expect(lnSyncService.sendResult).not.toHaveBeenCalled();
    });

    it('reenvia quando o status de sincronização é FAILED', async () => {
      workflowRepository.findByPurchaseOrderId.mockResolvedValue(
        buildWorkflow({ lnSyncStatus: 'FAILED' }),
      );

      await service.retryLnSync('po-1');

      expect(lnSyncService.sendResult).toHaveBeenCalledWith('workflow-1');
    });
  });
});
