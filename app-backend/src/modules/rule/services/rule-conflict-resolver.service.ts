import { Injectable } from '@nestjs/common';

import { RuleWithRelations } from '../types/rule-with-relations';

@Injectable()
export class RuleConflictResolverService {
  resolve(matchedRules: RuleWithRelations[]): RuleWithRelations {
    if (matchedRules.length === 0) {
      throw new Error('Cannot resolve conflict: no matched rules provided');
    }

    if (matchedRules.length === 1) {
      return matchedRules[0];
    }

    const sortedByPriority = [...matchedRules].sort((a, b) =>
      this.byPriority(a, b),
    );
    const governingRule = sortedByPriority[0];

    switch (governingRule.conflictStrategy) {
      case 'MOST_RESTRICTIVE':
        return this.mostRestrictive(matchedRules);
      case 'FIRST_MATCH':
        return this.firstMatch(matchedRules);
      case 'HIGHEST_PRIORITY':
      default:
        return sortedByPriority[0];
    }
  }

  private byPriority(a: RuleWithRelations, b: RuleWithRelations): number {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    if (a.createdAt.getTime() !== b.createdAt.getTime()) {
      return a.createdAt.getTime() - b.createdAt.getTime();
    }

    return a.ruleId.localeCompare(b.ruleId);
  }

  private approverCount(rule: RuleWithRelations): number {
    return rule.levels.reduce((sum, level) => sum + level.approvers.length, 0);
  }

  private mostRestrictive(rules: RuleWithRelations[]): RuleWithRelations {
    return [...rules].sort((a, b) => {
      if (b.levels.length !== a.levels.length) {
        return b.levels.length - a.levels.length;
      }

      const approverDelta = this.approverCount(b) - this.approverCount(a);
      if (approverDelta !== 0) {
        return approverDelta;
      }

      return this.byPriority(a, b);
    })[0];
  }

  private firstMatch(rules: RuleWithRelations[]): RuleWithRelations {
    return [...rules].sort((a, b) => {
      if (a.createdAt.getTime() !== b.createdAt.getTime()) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }

      return a.ruleId.localeCompare(b.ruleId);
    })[0];
  }
}
