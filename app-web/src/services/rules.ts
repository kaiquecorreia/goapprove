import { getFromBackend } from '@/lib/backendClient';
import type { ConflictStrategy, Rule, RuleOperator, RuleType } from '@/lib/mock/types';

interface BackendRuleCondition {
  sourceType: 'PO_HEADER' | 'PO_LINE' | 'PO_ADDITIONAL' | 'MANUAL_FIELD';
  field: string;
  operator: RuleOperator;
  value: string | null;
  valueTo: string | null;
  valueList: string[] | null;
}

interface BackendRuleLevelApprover {
  userId: string;
  user: { name: string };
}

interface BackendRuleLevel {
  levelNumber: number;
  mode: 'ANY' | 'ALL' | 'SEQUENTIAL';
  approvers: BackendRuleLevelApprover[];
}

interface BackendRule {
  ruleId: string;
  code: string;
  name: string;
  description: string | null;
  companyId: string;
  priority: number;
  validFrom: string;
  validTo: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  ruleType: RuleType;
  conflictStrategy: ConflictStrategy;
  conditions: BackendRuleCondition[];
  levels: BackendRuleLevel[];
}

function toFrontendRule(rule: BackendRule): Rule {
  return {
    id: rule.ruleId,
    code: rule.code,
    name: rule.name,
    description: rule.description ?? undefined,
    companyId: rule.companyId,
    priority: rule.priority,
    validFrom: rule.validFrom,
    validTo: rule.validTo ?? undefined,
    ruleType: rule.ruleType,
    conflictStrategy: rule.conflictStrategy,
    status: rule.status === 'ACTIVE' ? 'Ativa' : 'Inativa',
    criteria: rule.conditions.map((condition) => ({
      sourceType: condition.sourceType === 'MANUAL_FIELD' ? 'PO_HEADER' : condition.sourceType,
      field: condition.field,
      operator: condition.operator,
      value: condition.value ?? undefined,
      valueTo: condition.valueTo ?? undefined,
      valueList: condition.valueList ?? undefined,
    })),
    levels: rule.levels
      .slice()
      .sort((a, b) => a.levelNumber - b.levelNumber)
      .map((level) => ({
        level: level.levelNumber,
        mode: level.mode,
        approvers: level.approvers.map((approver) => ({
          userId: approver.userId,
          name: approver.user.name,
        })),
      })),
  };
}

export async function getRules(companyId?: string): Promise<Rule[]> {
  const data = await getFromBackend<BackendRule[]>('/rules', companyId ? { companyId } : undefined);

  return data.map(toFrontendRule);
}
