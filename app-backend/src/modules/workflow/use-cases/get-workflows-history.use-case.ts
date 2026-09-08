import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { ListWorkflowsHistoryDto } from '../dtos/list-workflows-history.dto';
import { WorkflowService } from '../services/workflow.service';

@Injectable()
export class GetWorkflowsHistoryUseCase {
  constructor(private readonly workflowService: WorkflowService) {}

  execute(user: AuthenticatedUser, query: ListWorkflowsHistoryDto) {
    return this.workflowService.findHistory(user, query);
  }
}
