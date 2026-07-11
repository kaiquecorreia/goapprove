import {
  Rule,
  RuleCondition,
  RuleLevel,
  RuleLevelApprover,
  User,
} from '@prisma/client';

export type RuleLevelApproverWithUser = RuleLevelApprover & { user: User };

export type RuleLevelWithApprovers = RuleLevel & {
  approvers: RuleLevelApproverWithUser[];
};

export type RuleWithRelations = Rule & {
  conditions: RuleCondition[];
  levels: RuleLevelWithApprovers[];
};
