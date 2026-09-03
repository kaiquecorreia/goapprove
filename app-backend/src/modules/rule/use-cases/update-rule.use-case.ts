import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { UpdateRuleDto } from '../dtos/update-rule.dto';
import { RuleService } from '../services/rule.service';

@Injectable()
export class UpdateRuleUseCase {
  constructor(private readonly ruleService: RuleService) {}

  execute(ruleId: string, data: UpdateRuleDto, actingUser: AuthenticatedUser) {
    return this.ruleService.update(ruleId, data, actingUser);
  }
}
