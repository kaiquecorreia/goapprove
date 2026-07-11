import { Injectable } from '@nestjs/common';

import { CreateRuleDto } from '../dtos/create-rule.dto';
import { RuleService } from '../services/rule.service';

@Injectable()
export class CreateRuleUseCase {
  constructor(private readonly ruleService: RuleService) {}

  execute(data: CreateRuleDto) {
    return this.ruleService.create(data);
  }
}
