import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CreateRuleDto } from '../dtos/create-rule.dto';
import { RuleService } from '../services/rule.service';

@Injectable()
export class CreateRuleUseCase {
  constructor(private readonly ruleService: RuleService) {}

  execute(data: CreateRuleDto, actingUser: AuthenticatedUser) {
    return this.ruleService.create(data, actingUser);
  }
}
