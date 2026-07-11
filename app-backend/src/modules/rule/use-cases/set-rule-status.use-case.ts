import { Injectable } from '@nestjs/common';
import { RuleStatus } from '@prisma/client';

import { RuleService } from '../services/rule.service';

@Injectable()
export class SetRuleStatusUseCase {
  constructor(private readonly ruleService: RuleService) {}

  execute(ruleId: string, status: RuleStatus) {
    return this.ruleService.setStatus(ruleId, status);
  }
}
