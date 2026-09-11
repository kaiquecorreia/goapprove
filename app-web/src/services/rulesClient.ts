import type { ConflictStrategy, RuleOperator, RuleType } from '@/lib/mock/types';

export interface RuleConditionPayload {
  sourceType: 'PO_HEADER' | 'PO_LINE' | 'PO_ADDITIONAL';
  field: string;
  operator: RuleOperator;
  value?: string;
  valueTo?: string;
  valueList?: string[];
}

export interface RuleLevelPayload {
  levelNumber: number;
  mode: 'ANY' | 'ALL' | 'SEQUENTIAL';
  approverUserIds: string[];
}

export interface RulePayload {
  code: string;
  name: string;
  description?: string;
  companyId: string;
  priority: number;
  validFrom: string;
  validTo?: string;
  ruleType: RuleType;
  conflictStrategy: ConflictStrategy;
  conditions: RuleConditionPayload[];
  levels: RuleLevelPayload[];
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('; ') : data?.message;
    throw new Error(message ?? 'Falha na requisição');
  }

  return data;
}

export async function createRule(payload: RulePayload) {
  const response = await fetch('/api/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateRule(ruleId: string, payload: Partial<RulePayload>) {
  const response = await fetch(`/api/rules/${ruleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function setRuleStatus(ruleId: string, status: 'ACTIVE' | 'INACTIVE') {
  const response = await fetch(`/api/rules/${ruleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return parseResponse(response);
}

export async function deactivateRule(ruleId: string) {
  const response = await fetch(`/api/rules/${ruleId}`, { method: 'DELETE' });
  return parseResponse(response);
}
