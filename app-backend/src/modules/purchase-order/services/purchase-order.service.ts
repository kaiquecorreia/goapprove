import { Injectable, NotFoundException } from '@nestjs/common';

import { TransactionService } from '../../../shared/prisma/transaction.service';
import { AuditService } from '../../audit/services/audit.service';
import { CompanyRepository } from '../../company/repositories/company.repository';
import { RuleEngineService } from '../../rule/services/rule-engine.service';
import { WorkflowRepository } from '../../workflow/repositories/workflow.repository';
import { WorkflowService } from '../../workflow/services/workflow.service';
import { WorkflowWithRelations } from '../../workflow/types/workflow-with-relations';
import { ReceivePurchaseOrderDto } from '../dtos/receive-purchase-order.dto';
import {
  PurchaseOrderRepository,
  PurchaseOrderWithLines,
} from '../repositories/purchase-order.repository';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly ruleEngineService: RuleEngineService,
    private readonly workflowService: WorkflowService,
    private readonly workflowRepository: WorkflowRepository,
    private readonly transactionService: TransactionService,
    private readonly auditService: AuditService,
  ) {}

  async receive(dto: ReceivePurchaseOrderDto) {
    const company = await this.companyRepository.findFirst({
      externalIntegrationCode: dto.company.code,
    });

    if (!company) {
      throw new NotFoundException(
        `Company with external integration code ${dto.company.code} not found`,
      );
    }

    const existing = await this.purchaseOrderRepository.findLatestByOrderNumber(
      company.companyId,
      dto.purchaseOrder.orderNumber,
    );

    const purchaseOrder = existing
      ? await this.replaceExisting(existing, dto)
      : await this.purchaseOrderRepository.create(company.companyId, dto);

    const ruleMatch = await this.ruleEngineService.evaluate(purchaseOrder);
    await this.workflowService.startWorkflow(
      purchaseOrder.purchaseOrderId,
      ruleMatch,
    );

    return purchaseOrder;
  }

  // A re-sent order overwrites the current one and restarts approval from
  // scratch. Deleting the workflow cascades its decisions away, so they are
  // snapshotted into the audit trail first; the purchaseOrderId is kept, which
  // keeps the order's timeline continuous.
  private async replaceExisting(
    existing: PurchaseOrderWithLines,
    dto: ReceivePurchaseOrderDto,
  ): Promise<PurchaseOrderWithLines> {
    return this.transactionService.run(async () => {
      const { purchaseOrderId, companyId } = existing;
      const previousWorkflow =
        await this.workflowRepository.findByPurchaseOrderId(purchaseOrderId);

      if (previousWorkflow) {
        this.auditService.log({
          action: 'workflow.reset',
          entity: 'PurchaseOrder',
          entityId: purchaseOrderId,
          companyId,
          severity: 'warning',
          message:
            'OC reenviada pelo ERP; fluxo de aprovação anterior descartado e reiniciado.',
          metadata: this.workflowSnapshot(previousWorkflow),
          critical: true,
        });

        await this.workflowRepository.deleteByPurchaseOrderId(purchaseOrderId);
      }

      const updated = await this.purchaseOrderRepository.update(
        purchaseOrderId,
        dto,
      );

      this.auditService.log({
        action: 'purchase_order.updated',
        entity: 'PurchaseOrder',
        entityId: purchaseOrderId,
        companyId,
        severity: 'info',
        message: `OC atualizada pelo ERP (revisão ${existing.revision} → ${updated.revision}).`,
        metadata: { requestId: updated.requestId, batchId: updated.batchId },
        before: this.purchaseOrderSnapshot(existing),
        after: this.purchaseOrderSnapshot(updated),
        critical: true,
      });

      return updated;
    });
  }

  // Decimals are stringified up front: the audit sanitizer would otherwise
  // walk Prisma.Decimal's internals as a plain object.
  private purchaseOrderSnapshot(po: PurchaseOrderWithLines) {
    return {
      requestId: po.requestId,
      batchId: po.batchId,
      revision: po.revision,
      status: po.status,
      statusLn: po.statusLn,
      supplierCode: po.supplierCode,
      requesterCode: po.requesterCode,
      costCenter: po.costCenter,
      currency: po.currency,
      totalAmount: po.totalAmount.toString(),
      lines: po.lines.map((line) => ({
        lineNumber: line.lineNumber,
        itemCode: line.itemCode,
        quantity: line.quantity.toString(),
        unitPrice: line.unitPrice.toString(),
        lineAmount: line.lineAmount.toString(),
        costCenter: line.costCenter,
      })),
    };
  }

  private workflowSnapshot(workflow: WorkflowWithRelations) {
    return {
      workflowId: workflow.workflowId,
      status: workflow.status,
      ruleCode: workflow.rule?.code ?? null,
      currentLevel: workflow.currentLevel,
      lnSyncStatus: workflow.lnSyncStatus,
      decisions: workflow.levels.flatMap((level) =>
        level.decisions.map((decision) => ({
          level: level.level,
          assignedUserId: decision.assignedUserId,
          assignedUserName:
            level.approvers.find((a) => a.userId === decision.assignedUserId)
              ?.user.name ?? null,
          actingUserId: decision.actingUserId,
          decision: decision.decision,
          comment: decision.comment,
          decidedAt: decision.decidedAt.toISOString(),
        })),
      ),
    };
  }
}
