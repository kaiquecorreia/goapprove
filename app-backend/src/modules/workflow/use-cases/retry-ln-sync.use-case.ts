import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { WorkflowService } from '../services/workflow.service';

@Injectable()
export class RetryLnSyncUseCase {
  constructor(private readonly workflowService: WorkflowService) {}

  execute(purchaseOrderId: string, actingUser: AuthenticatedUser) {
    return this.workflowService.retryLnSync(purchaseOrderId, actingUser);
  }
}
