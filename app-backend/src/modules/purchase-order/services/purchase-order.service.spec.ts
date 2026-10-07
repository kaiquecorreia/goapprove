import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TransactionService } from '../../../shared/prisma/transaction.service';
import { AuditService } from '../../audit/services/audit.service';
import { CompanyRepository } from '../../company/repositories/company.repository';
import { RuleEngineService } from '../../rule/services/rule-engine.service';
import { WorkflowRepository } from '../../workflow/repositories/workflow.repository';
import { WorkflowService } from '../../workflow/services/workflow.service';
import { ReceivePurchaseOrderDto } from '../dtos/receive-purchase-order.dto';
import {
  PurchaseOrderRepository,
  PurchaseOrderWithLines,
} from '../repositories/purchase-order.repository';
import { PurchaseOrderService } from './purchase-order.service';

const dto = {
  company: { code: '3101' },
  requestId: 'REQ-2',
  batchId: 'BATCH-2',
  purchaseOrder: { orderNumber: 'CN0004071', revision: 2 },
  lines: [],
} as unknown as ReceivePurchaseOrderDto;

function buildPurchaseOrder(
  overrides: Partial<PurchaseOrderWithLines> = {},
): PurchaseOrderWithLines {
  return {
    purchaseOrderId: 'po-1',
    companyId: 'company-1',
    requestId: 'REQ-1',
    batchId: 'BATCH-1',
    revision: 1,
    status: 'APPROVED',
    totalAmount: new Prisma.Decimal('100.50'),
    lines: [
      {
        lineNumber: 1,
        itemCode: 'ITEM',
        quantity: new Prisma.Decimal('2'),
        unitPrice: new Prisma.Decimal('50.25'),
        lineAmount: new Prisma.Decimal('100.50'),
        costCenter: null,
      },
    ],
    ...overrides,
  } as unknown as PurchaseOrderWithLines;
}

describe('PurchaseOrderService', () => {
  let companyRepository: { findFirst: jest.Mock };
  let purchaseOrderRepository: jest.Mocked<PurchaseOrderRepository>;
  let ruleEngineService: { evaluate: jest.Mock };
  let workflowService: { startWorkflow: jest.Mock };
  let workflowRepository: {
    findByPurchaseOrderId: jest.Mock;
    deleteByPurchaseOrderId: jest.Mock;
  };
  let auditService: { log: jest.Mock };
  let service: PurchaseOrderService;

  beforeEach(() => {
    companyRepository = {
      findFirst: jest.fn().mockResolvedValue({ companyId: 'company-1' }),
    };
    purchaseOrderRepository = {
      create: jest.fn(),
      findLatestByOrderNumber: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    };
    ruleEngineService = { evaluate: jest.fn().mockResolvedValue(null) };
    workflowService = { startWorkflow: jest.fn() };
    workflowRepository = {
      findByPurchaseOrderId: jest.fn().mockResolvedValue(null),
      deleteByPurchaseOrderId: jest.fn(),
    };
    auditService = { log: jest.fn() };

    service = new PurchaseOrderService(
      companyRepository as unknown as CompanyRepository,
      purchaseOrderRepository,
      ruleEngineService as unknown as RuleEngineService,
      workflowService as unknown as WorkflowService,
      workflowRepository as unknown as WorkflowRepository,
      {
        run: jest.fn((fn: () => Promise<unknown>) => fn()),
      } as unknown as TransactionService,
      auditService as unknown as AuditService,
    );
  });

  it('empresa desconhecida: 404', async () => {
    companyRepository.findFirst.mockResolvedValue(null);

    await expect(service.receive(dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('OC nova: cria e inicia o workflow', async () => {
    const created = buildPurchaseOrder({ status: 'PENDING' });
    purchaseOrderRepository.create.mockResolvedValue(created);

    await service.receive(dto);

    expect(
      purchaseOrderRepository.findLatestByOrderNumber,
    ).toHaveBeenCalledWith('company-1', 'CN0004071');
    expect(purchaseOrderRepository.create).toHaveBeenCalledWith(
      'company-1',
      dto,
    );
    expect(purchaseOrderRepository.update).not.toHaveBeenCalled();
    expect(workflowRepository.deleteByPurchaseOrderId).not.toHaveBeenCalled();
    expect(workflowService.startWorkflow).toHaveBeenCalledWith('po-1', null);
  });

  it('OC existente: audita o workflow anterior, descarta-o, atualiza a OC e reinicia o fluxo', async () => {
    const existing = buildPurchaseOrder();
    const updated = buildPurchaseOrder({
      requestId: 'REQ-2',
      batchId: 'BATCH-2',
      revision: 2,
      status: 'PENDING',
    });
    purchaseOrderRepository.findLatestByOrderNumber.mockResolvedValue(existing);
    purchaseOrderRepository.update.mockResolvedValue(updated);
    workflowRepository.findByPurchaseOrderId.mockResolvedValue({
      workflowId: 'workflow-1',
      status: 'APPROVED',
      currentLevel: null,
      lnSyncStatus: 'SYNCED',
      rule: { code: 'R1', name: 'Rule 1' },
      levels: [
        {
          level: 1,
          approvers: [{ userId: 'user-1', user: { name: 'Joao Silva' } }],
          decisions: [
            {
              assignedUserId: 'user-1',
              actingUserId: 'user-1',
              decision: 'APPROVED',
              comment: 'Aprovado.',
              decidedAt: new Date('2026-10-04T15:45:00.000Z'),
            },
          ],
        },
      ],
    });

    const result = await service.receive(dto);

    expect(result).toBe(updated);
    expect(purchaseOrderRepository.create).not.toHaveBeenCalled();
    expect(workflowRepository.deleteByPurchaseOrderId).toHaveBeenCalledWith(
      'po-1',
    );
    expect(purchaseOrderRepository.update).toHaveBeenCalledWith('po-1', dto);

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'workflow.reset',
        entityId: 'po-1',
        critical: true,
        metadata: expect.objectContaining({
          status: 'APPROVED',
          ruleCode: 'R1',
          decisions: [
            expect.objectContaining({
              level: 1,
              assignedUserName: 'Joao Silva',
              decision: 'APPROVED',
              comment: 'Aprovado.',
            }),
          ],
        }) as unknown,
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'purchase_order.updated',
        entityId: 'po-1',
        critical: true,
        before: expect.objectContaining({
          requestId: 'REQ-1',
          revision: 1,
          totalAmount: '100.5',
        }) as unknown,
        after: expect.objectContaining({
          requestId: 'REQ-2',
          revision: 2,
        }) as unknown,
      }),
    );
    expect(workflowService.startWorkflow).toHaveBeenCalledWith('po-1', null);
  });

  it('OC existente sem workflow: só atualiza, sem auditar reset', async () => {
    purchaseOrderRepository.findLatestByOrderNumber.mockResolvedValue(
      buildPurchaseOrder(),
    );
    purchaseOrderRepository.update.mockResolvedValue(buildPurchaseOrder());

    await service.receive(dto);

    expect(workflowRepository.deleteByPurchaseOrderId).not.toHaveBeenCalled();
    expect(auditService.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'workflow.reset' }),
    );
    expect(purchaseOrderRepository.update).toHaveBeenCalled();
  });
});
