import { Injectable } from '@nestjs/common';

import { PurchaseOrderWithLines } from '../../purchase-order/repositories/purchase-order.repository';
import { RuleRepository } from '../repositories/rule.repository';
import { MatchedRuleResult } from '../types/matched-rule-result';
import { RuleWithRelations } from '../types/rule-with-relations';
import { RuleConditionEvaluatorService } from './rule-condition-evaluator.service';
import { RuleConflictResolverService } from './rule-conflict-resolver.service';

@Injectable()
export class RuleEngineService {
  constructor(
    private readonly ruleRepository: RuleRepository,
    private readonly conditionEvaluator: RuleConditionEvaluatorService,
    private readonly conflictResolver: RuleConflictResolverService,
  ) {}

  async evaluate(
    purchaseOrder: PurchaseOrderWithLines,
    options?: { at?: Date },
  ): Promise<MatchedRuleResult | null> {
    const now = options?.at ?? new Date();
    const candidates = await this.ruleRepository.findActiveCandidates(
      purchaseOrder.companyId,
      now,
    );

    const matched = candidates.filter((rule) =>
      this.matchesAllConditions(rule, purchaseOrder),
    );

    if (matched.length === 0) {
      return null;
    }

    const winner =
      matched.length === 1
        ? matched[0]
        : this.conflictResolver.resolve(matched);
    const conflictedWith = matched
      .filter((rule) => rule.ruleId !== winner.ruleId)
      .map((rule) => ({
        ruleId: rule.ruleId,
        code: rule.code,
        name: rule.name,
      }));

    return {
      rule: {
        ruleId: winner.ruleId,
        code: winner.code,
        name: winner.name,
        ruleType: winner.ruleType,
      },
      levels: winner.levels
        .slice()
        .sort((a, b) => a.levelNumber - b.levelNumber)
        .map((level) => ({
          levelNumber: level.levelNumber,
          mode: level.mode,
          approverUserIds: level.approvers.map((approver) => approver.userId),
        })),
      matchedAt: now,
      conflictedWith: conflictedWith.length > 0 ? conflictedWith : undefined,
    };
  }

  private matchesAllConditions(
    rule: RuleWithRelations,
    po: PurchaseOrderWithLines,
  ): boolean {
    return rule.conditions.every((condition) =>
      this.conditionEvaluator.evaluate(condition, po),
    );
  }
}
