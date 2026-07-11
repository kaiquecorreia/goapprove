import { RuleCondition } from '@prisma/client';

import { PurchaseOrderWithLines } from '../../purchase-order/repositories/purchase-order.repository';
import { RuleConditionEvaluatorService } from './rule-condition-evaluator.service';
import { RuleOperatorEvaluatorService } from './rule-operator-evaluator.service';

function buildCondition(overrides: Partial<RuleCondition>): RuleCondition {
  return {
    ruleConditionId: 'condition-1',
    ruleId: 'rule-1',
    sourceType: 'PO_HEADER',
    field: 'totalAmount',
    operator: 'GREATER_THAN',
    value: '100000',
    valueTo: null,
    valueList: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function buildPurchaseOrder(
  overrides: Partial<PurchaseOrderWithLines> = {},
): PurchaseOrderWithLines {
  return {
    purchaseOrderId: 'po-1',
    companyId: 'company-1',
    totalAmount: 150000,
    costCenter: 'CC-1001',
    additionalFields: { urgency: 'HIGH' },
    lines: [
      {
        itemCode: 'MAT-0001',
        category: 'MRO',
        costCenter: 'CC-1001',
        lineAmount: 5000,
      },
      {
        itemCode: 'SERV-0099',
        category: 'SERVICOS',
        costCenter: 'CC-1001',
        lineAmount: 10000,
      },
    ],
    ...overrides,
  } as unknown as PurchaseOrderWithLines;
}

describe('RuleConditionEvaluatorService', () => {
  let evaluator: RuleConditionEvaluatorService;

  beforeEach(() => {
    evaluator = new RuleConditionEvaluatorService(
      new RuleOperatorEvaluatorService(),
    );
  });

  it('resolve campos do cabeçalho da OC (PO_HEADER)', () => {
    const condition = buildCondition({
      sourceType: 'PO_HEADER',
      field: 'totalAmount',
    });
    expect(evaluator.evaluate(condition, buildPurchaseOrder())).toBe(true);
  });

  it('casa condição de linha (PO_LINE) se QUALQUER linha satisfizer', () => {
    const condition = buildCondition({
      sourceType: 'PO_LINE',
      field: 'category',
      operator: 'EQUALS',
      value: 'SERVICOS',
    });
    expect(evaluator.evaluate(condition, buildPurchaseOrder())).toBe(true);
  });

  it('não casa condição de linha se NENHUMA linha satisfizer', () => {
    const condition = buildCondition({
      sourceType: 'PO_LINE',
      field: 'category',
      operator: 'EQUALS',
      value: 'TI',
    });
    expect(evaluator.evaluate(condition, buildPurchaseOrder())).toBe(false);
  });

  it('resolve chaves arbitrárias dentro de additionalFields (PO_ADDITIONAL)', () => {
    const condition = buildCondition({
      sourceType: 'PO_ADDITIONAL',
      field: 'urgency',
      operator: 'EQUALS',
      value: 'HIGH',
    });
    expect(evaluator.evaluate(condition, buildPurchaseOrder())).toBe(true);
  });

  it('retorna falso para additionalFields nulo', () => {
    const condition = buildCondition({
      sourceType: 'PO_ADDITIONAL',
      field: 'urgency',
      operator: 'EXISTS',
    });
    expect(
      evaluator.evaluate(
        condition,
        buildPurchaseOrder({ additionalFields: null }),
      ),
    ).toBe(false);
  });

  it('MANUAL_FIELD ainda não possui armazenamento — sempre retorna falso', () => {
    const condition = buildCondition({
      sourceType: 'MANUAL_FIELD',
      field: 'anything',
    });
    expect(evaluator.evaluate(condition, buildPurchaseOrder())).toBe(false);
  });
});
