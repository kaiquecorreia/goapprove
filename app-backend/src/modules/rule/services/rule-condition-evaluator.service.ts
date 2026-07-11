import { Injectable } from '@nestjs/common';
import { RuleCondition } from '@prisma/client';

import { PurchaseOrderWithLines } from '../../purchase-order/repositories/purchase-order.repository';
import { RuleOperatorEvaluatorService } from './rule-operator-evaluator.service';

@Injectable()
export class RuleConditionEvaluatorService {
  constructor(
    private readonly operatorEvaluator: RuleOperatorEvaluatorService,
  ) {}

  evaluate(condition: RuleCondition, po: PurchaseOrderWithLines): boolean {
    switch (condition.sourceType) {
      case 'PO_HEADER':
        return this.operatorEvaluator.evaluate(
          condition.operator,
          this.resolveHeaderField(po, condition.field),
          condition,
        );
      case 'PO_LINE':
        return po.lines.some((line) =>
          this.operatorEvaluator.evaluate(
            condition.operator,
            this.resolveLineField(line, condition.field),
            condition,
          ),
        );
      case 'PO_ADDITIONAL':
        return this.operatorEvaluator.evaluate(
          condition.operator,
          this.resolveAdditionalField(po, condition.field),
          condition,
        );
      case 'MANUAL_FIELD':
        // Reserved: no backing store for portal-manual field values yet.
        return false;
      default:
        return false;
    }
  }

  private resolveHeaderField(
    po: PurchaseOrderWithLines,
    field: string,
  ): unknown {
    return (po as unknown as Record<string, unknown>)[field];
  }

  private resolveLineField(
    line: PurchaseOrderWithLines['lines'][number],
    field: string,
  ): unknown {
    return (line as unknown as Record<string, unknown>)[field];
  }

  private resolveAdditionalField(
    po: PurchaseOrderWithLines,
    field: string,
  ): unknown {
    const additionalFields = po.additionalFields as Record<
      string,
      unknown
    > | null;
    return additionalFields ? additionalFields[field] : undefined;
  }
}
