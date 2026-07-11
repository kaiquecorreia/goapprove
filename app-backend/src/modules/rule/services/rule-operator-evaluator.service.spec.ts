import { RuleOperatorEvaluatorService } from './rule-operator-evaluator.service';

describe('RuleOperatorEvaluatorService', () => {
  let evaluator: RuleOperatorEvaluatorService;

  beforeEach(() => {
    evaluator = new RuleOperatorEvaluatorService();
  });

  describe('EQUALS / NOT_EQUALS', () => {
    it('compara strings ignorando maiúsculas/minúsculas', () => {
      expect(evaluator.evaluate('EQUALS', 'MRO', { value: 'mro' })).toBe(true);
      expect(evaluator.evaluate('NOT_EQUALS', 'MRO', { value: 'mro' })).toBe(
        false,
      );
    });

    it('compara números mesmo com formatação diferente', () => {
      expect(evaluator.evaluate('EQUALS', 100, { value: '100.0' })).toBe(true);
    });

    it('retorna falso quando não há valor de comparação', () => {
      expect(evaluator.evaluate('EQUALS', 'x', { value: undefined })).toBe(
        false,
      );
    });
  });

  describe('comparadores numéricos', () => {
    it('GREATER_THAN retorna true quando o valor real é maior', () => {
      expect(
        evaluator.evaluate('GREATER_THAN', 150000, { value: '100000' }),
      ).toBe(true);
      expect(
        evaluator.evaluate('GREATER_THAN', 50000, { value: '100000' }),
      ).toBe(false);
    });

    it('GREATER_THAN_OR_EQUAL inclui o limite', () => {
      expect(
        evaluator.evaluate('GREATER_THAN_OR_EQUAL', 100000, {
          value: '100000',
        }),
      ).toBe(true);
    });

    it('LESS_THAN e LESS_THAN_OR_EQUAL funcionam simetricamente', () => {
      expect(evaluator.evaluate('LESS_THAN', 50, { value: '100' })).toBe(true);
      expect(
        evaluator.evaluate('LESS_THAN_OR_EQUAL', 100, { value: '100' }),
      ).toBe(true);
    });

    it('retorna falso quando o valor real não é numérico', () => {
      expect(evaluator.evaluate('GREATER_THAN', 'abc', { value: '100' })).toBe(
        false,
      );
    });
  });

  describe('BETWEEN', () => {
    it('inclui os limites inferior e superior', () => {
      expect(
        evaluator.evaluate('BETWEEN', 50000, {
          value: '5000',
          valueTo: '50000',
        }),
      ).toBe(true);
      expect(
        evaluator.evaluate('BETWEEN', 4999, {
          value: '5000',
          valueTo: '50000',
        }),
      ).toBe(false);
    });

    it('retorna falso quando valueTo está ausente', () => {
      expect(evaluator.evaluate('BETWEEN', 10000, { value: '5000' })).toBe(
        false,
      );
    });
  });

  describe('CONTAINS', () => {
    it('faz busca de substring case-insensitive', () => {
      expect(
        evaluator.evaluate('CONTAINS', 'Material de manutenção', {
          value: 'MANUTENÇÃO',
        }),
      ).toBe(true);
    });

    it('retorna falso quando o valor real é nulo', () => {
      expect(evaluator.evaluate('CONTAINS', null, { value: 'x' })).toBe(false);
    });
  });

  describe('IN_LIST / NOT_IN_LIST', () => {
    it('IN_LIST retorna true quando o valor está na lista', () => {
      expect(
        evaluator.evaluate('IN_LIST', 'CC-1001', {
          valueList: ['CC-1001', 'CC-1002'],
        }),
      ).toBe(true);
    });

    it('NOT_IN_LIST retorna true quando o valor não está na lista', () => {
      expect(
        evaluator.evaluate('NOT_IN_LIST', 'CC-9999', {
          valueList: ['CC-1001', 'CC-1002'],
        }),
      ).toBe(true);
    });

    it('trata lista ausente como lista vazia', () => {
      expect(
        evaluator.evaluate('IN_LIST', 'CC-1001', { valueList: undefined }),
      ).toBe(false);
      expect(
        evaluator.evaluate('NOT_IN_LIST', 'CC-1001', { valueList: undefined }),
      ).toBe(true);
    });
  });

  describe('EXISTS / NOT_EXISTS', () => {
    it('EXISTS é falso para null, undefined e string vazia', () => {
      expect(evaluator.evaluate('EXISTS', null, {})).toBe(false);
      expect(evaluator.evaluate('EXISTS', undefined, {})).toBe(false);
      expect(evaluator.evaluate('EXISTS', '', {})).toBe(false);
      expect(evaluator.evaluate('EXISTS', 'PRJ-01', {})).toBe(true);
    });

    it('NOT_EXISTS é a negação de EXISTS', () => {
      expect(evaluator.evaluate('NOT_EXISTS', null, {})).toBe(true);
      expect(evaluator.evaluate('NOT_EXISTS', 'PRJ-01', {})).toBe(false);
    });
  });
});
