import { Injectable, NotFoundException } from '@nestjs/common';

import { CompanyRepository } from '../../company/repositories/company.repository';
import { RuleEngineService } from '../../rule/services/rule-engine.service';
import { WorkflowService } from '../../workflow/services/workflow.service';
import { ReceivePurchaseOrderDto } from '../dtos/receive-purchase-order.dto';
import { PurchaseOrderRepository } from '../repositories/purchase-order.repository';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly ruleEngineService: RuleEngineService,
    private readonly workflowService: WorkflowService,
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

    const purchaseOrder = await this.purchaseOrderRepository.create(
      company.companyId,
      dto,
    );

    const ruleMatch = await this.ruleEngineService.evaluate(purchaseOrder);
    await this.workflowService.startWorkflow(
      purchaseOrder.purchaseOrderId,
      ruleMatch,
    );

    return purchaseOrder;
  }
}
