import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { RuleService } from '../services/rule.service';

@Injectable()
export class DeleteRuleUseCase {
  constructor(private readonly ruleService: RuleService) {}

  execute(ruleId: string, actingUser: AuthenticatedUser) {
    return this.ruleService.delete(ruleId, actingUser);
  }
}
