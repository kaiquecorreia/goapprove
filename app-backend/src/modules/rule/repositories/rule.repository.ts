import { CreateRuleDto } from '../dtos/create-rule.dto';
import { UpdateRuleDto } from '../dtos/update-rule.dto';
import { RuleWithRelations } from '../types/rule-with-relations';

export abstract class RuleRepository {
  abstract create(data: CreateRuleDto): Promise<RuleWithRelations>;
  abstract findById(ruleId: string): Promise<RuleWithRelations | null>;
  abstract findByCode(code: string): Promise<RuleWithRelations | null>;
  abstract findAll(filter?: {
    companyId?: string;
  }): Promise<RuleWithRelations[]>;
  abstract findActiveCandidates(
    companyId: string,
    now: Date,
  ): Promise<RuleWithRelations[]>;
  abstract update(
    ruleId: string,
    data: UpdateRuleDto,
  ): Promise<RuleWithRelations | null>;
}
