import { Injectable } from '@nestjs/common';
import { RuleOperator } from '@prisma/client';

export interface OperatorConditionInput {
  value?: string | null;
  valueTo?: string | null;
  valueList?: unknown;
}

@Injectable()
export class RuleOperatorEvaluatorService {
  evaluate(
    operator: RuleOperator,
    actual: unknown,
    condition: OperatorConditionInput,
  ): boolean {
    switch (operator) {
      case 'EQUALS':
        return this.equals(actual, condition.value);
      case 'NOT_EQUALS':
        return !this.equals(actual, condition.value);
      case 'GREATER_THAN':
        return this.compareNumeric(actual, condition.value, (a, b) => a > b);
      case 'GREATER_THAN_OR_EQUAL':
        return this.compareNumeric(actual, condition.value, (a, b) => a >= b);
      case 'LESS_THAN':
        return this.compareNumeric(actual, condition.value, (a, b) => a < b);
      case 'LESS_THAN_OR_EQUAL':
        return this.compareNumeric(actual, condition.value, (a, b) => a <= b);
      case 'BETWEEN':
        return this.between(actual, condition.value, condition.valueTo);
      case 'CONTAINS':
        return this.contains(actual, condition.value);
      case 'IN_LIST':
        return this.inList(actual, condition.valueList, true);
      case 'NOT_IN_LIST':
        return this.inList(actual, condition.valueList, false);
      case 'EXISTS':
        return this.exists(actual);
      case 'NOT_EXISTS':
        return !this.exists(actual);
      default:
        return false;
    }
  }

  private exists(actual: unknown): boolean {
    return actual !== null && actual !== undefined && actual !== '';
  }

  private equals(actual: unknown, value?: string | null): boolean {
    if (value === undefined || value === null) {
      return false;
    }

    if (this.isNumeric(actual) && this.isNumeric(value)) {
      return this.toNumber(actual) === this.toNumber(value);
    }

    return (
      this.toComparableString(actual).toLowerCase() === value.toLowerCase()
    );
  }

  private contains(actual: unknown, value?: string | null): boolean {
    if (value == null || actual === null || actual === undefined) {
      return false;
    }

    return this.toComparableString(actual)
      .toLowerCase()
      .includes(value.toLowerCase());
  }

  private inList(
    actual: unknown,
    valueList: unknown,
    expected: boolean,
  ): boolean {
    if (!Array.isArray(valueList)) {
      return !expected;
    }

    const actualStr = this.toComparableString(actual).toLowerCase();
    const found = valueList.some(
      (item) => String(item).toLowerCase() === actualStr,
    );

    return found === expected;
  }

  private between(
    actual: unknown,
    from?: string | null,
    to?: string | null,
  ): boolean {
    if (from == null || to == null || !this.isNumeric(actual)) {
      return false;
    }

    const value = this.toNumber(actual);

    return value >= this.toNumber(from) && value <= this.toNumber(to);
  }

  private compareNumeric(
    actual: unknown,
    value: string | null | undefined,
    compare: (a: number, b: number) => boolean,
  ): boolean {
    if (value == null || !this.isNumeric(actual) || !this.isNumeric(value)) {
      return false;
    }

    return compare(this.toNumber(actual), this.toNumber(value));
  }

  private isNumeric(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    return !Number.isNaN(this.toNumber(value));
  }

  private toNumber(value: unknown): number {
    return Number(String(value));
  }

  private toComparableString(value: unknown): string {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }

    return '';
  }
}
