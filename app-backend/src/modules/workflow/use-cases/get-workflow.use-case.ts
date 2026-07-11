import { Injectable } from '@nestjs/common';

import { WorkflowService } from '../services/workflow.service';

@Injectable()
export class GetWorkflowUseCase {
  constructor(private readonly workflowService: WorkflowService) {}

  execute(purchaseOrderId: string) {
    return this.workflowService.findByPurchaseOrderId(purchaseOrderId);
  }
}
