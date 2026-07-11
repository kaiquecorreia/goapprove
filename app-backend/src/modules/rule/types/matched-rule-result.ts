import { ApprovalMode } from '@prisma/client';

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
  };
  levels: MatchedRuleLevel[];
  matchedAt: Date;
  conflictedWith?: string[];
}
