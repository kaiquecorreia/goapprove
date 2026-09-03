import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { RuleService } from '../services/rule.service';

@Injectable()
export class GetRuleUseCase {
  constructor(private readonly ruleService: RuleService) {}

  executeAll(companyId: string | undefined, actingUser: AuthenticatedUser) {
    return this.ruleService.findAll(companyId, actingUser);
  }

  executeById(ruleId: string, actingUser: AuthenticatedUser) {
    return this.ruleService.findById(ruleId, actingUser);
  }
}
