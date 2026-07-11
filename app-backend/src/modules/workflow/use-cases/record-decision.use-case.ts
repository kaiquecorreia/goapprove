import { Injectable } from '@nestjs/common';

import { RecordDecisionDto } from '../dtos/record-decision.dto';
import { WorkflowService } from '../services/workflow.service';

@Injectable()
export class RecordDecisionUseCase {
  constructor(private readonly workflowService: WorkflowService) {}

  execute(
    purchaseOrderId: string,
    actingUserId: string,
    dto: RecordDecisionDto,
  ) {
    return this.workflowService.recordDecision({
      purchaseOrderId,
      actingUserId,
      decision: dto.decision,
      comment: dto.comment,
      onBehalfOfUserId: dto.onBehalfOfUserId,
    });
  }
}
