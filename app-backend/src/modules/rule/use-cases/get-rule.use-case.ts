import { Injectable } from '@nestjs/common';

import { RuleService } from '../services/rule.service';

@Injectable()
export class GetRuleUseCase {
  constructor(private readonly ruleService: RuleService) {}

  executeAll(companyId?: string) {
    return this.ruleService.findAll(companyId);
  }

  executeById(ruleId: string) {
    return this.ruleService.findById(ruleId);
  }
}
