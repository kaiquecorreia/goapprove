import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { ListPendingWorkflowsDto } from '../dtos/list-pending-workflows.dto';
import { WorkflowService } from '../services/workflow.service';

@Injectable()
export class GetPendingApprovalsUseCase {
  constructor(private readonly workflowService: WorkflowService) {}

  execute(user: AuthenticatedUser, query: ListPendingWorkflowsDto) {
    return this.workflowService.findPending(user, query);
  }
}
