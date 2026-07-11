import { Injectable } from '@nestjs/common';

import { UpdateRuleDto } from '../dtos/update-rule.dto';
import { RuleService } from '../services/rule.service';

@Injectable()
export class UpdateRuleUseCase {
  constructor(private readonly ruleService: RuleService) {}

  execute(ruleId: string, data: UpdateRuleDto) {
    return this.ruleService.update(ruleId, data);
  }
}
