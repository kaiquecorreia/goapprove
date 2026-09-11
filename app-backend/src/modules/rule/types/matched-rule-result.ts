import { ApprovalMode, RuleType } from '@prisma/client';

export interface MatchedRuleLevel {
  levelNumber: number;
  mode: ApprovalMode;
  approverUserIds: string[];
}

export interface MatchedRuleResult {
  rule: {
    ruleId: string;
    code: string;
    name: string;
    ruleType: RuleType;
  };
  levels: MatchedRuleLevel[];
  matchedAt: Date;
  conflictedWith?: ConflictedRule[];
}

export interface ConflictedRule {
  ruleId: string;
  code: string;
  name: string;
}
