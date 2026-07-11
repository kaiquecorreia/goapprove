import { Injectable } from '@nestjs/common';

import { RuleService } from '../services/rule.service';

@Injectable()
export class DeleteRuleUseCase {
  constructor(private readonly ruleService: RuleService) {}

  execute(ruleId: string) {
    return this.ruleService.delete(ruleId);
  }
}
