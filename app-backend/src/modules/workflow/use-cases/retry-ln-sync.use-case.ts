import { Injectable } from '@nestjs/common';

import { WorkflowService } from '../services/workflow.service';

@Injectable()
export class RetryLnSyncUseCase {
  constructor(private readonly workflowService: WorkflowService) {}

  execute(purchaseOrderId: string) {
    return this.workflowService.retryLnSync(purchaseOrderId);
  }
}
