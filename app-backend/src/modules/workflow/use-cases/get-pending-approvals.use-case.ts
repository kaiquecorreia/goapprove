import { Injectable } from '@nestjs/common';

import { WorkflowService } from '../services/workflow.service';

@Injectable()
export class GetPendingApprovalsUseCase {
  constructor(private readonly workflowService: WorkflowService) {}

  execute(userId: string) {
    return this.workflowService.findPendingForUser(userId);
  }
}
