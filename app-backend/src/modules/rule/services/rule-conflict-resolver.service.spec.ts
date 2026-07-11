import { RuleConflictResolverService } from './rule-conflict-resolver.service';
import { RuleWithRelations } from '../types/rule-with-relations';

function buildRule(overrides: Record<string, unknown>): RuleWithRelations {
  return {
    ruleId: 'rule-default',
    code: 'RULE',
    name: 'Rule',
    priority: 10,
    conflictStrategy: 'HIGHEST_PRIORITY',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    levels: [{ approvers: [{}] }],
    ...overrides,
  } as unknown as RuleWithRelations;
}

describe('RuleConflictResolverService', () => {
  let resolver: RuleConflictResolverService;

  beforeEach(() => {
    resolver = new RuleConflictResolverService();
  });

  it('retorna a única regra quando não há conflito', () => {
    const rule = buildRule({ ruleId: 'only' });
    expect(resolver.resolve([rule])).toBe(rule);
  });

  it('HIGHEST_PRIORITY: vence a regra com menor número de prioridade', () => {
    const highPriority = buildRule({
      ruleId: 'high',
      priority: 5,
      conflictStrategy: 'HIGHEST_PRIORITY',
    });
    const lowPriority = buildRule({ ruleId: 'low', priority: 20 });

    expect(resolver.resolve([lowPriority, highPriority]).ruleId).toBe('high');
  });

  it('MOST_RESTRICTIVE: vence a regra com mais níveis de aprovação', () => {
    const twoLevels = buildRule({
      ruleId: 'two-levels',
      priority: 5,
      conflictStrategy: 'MOST_RESTRICTIVE',
      levels: [{ approvers: [{}] }, { approvers: [{}] }],
    });
    const oneLevel = buildRule({
      ruleId: 'one-level',
      priority: 20,
      levels: [{ approvers: [{}] }],
    });

    expect(resolver.resolve([oneLevel, twoLevels]).ruleId).toBe('two-levels');
  });

  it('MOST_RESTRICTIVE: em empate de níveis, vence quem tem mais aprovadores no total', () => {
    const moreApprovers = buildRule({
      ruleId: 'more-approvers',
      priority: 5,
      conflictStrategy: 'MOST_RESTRICTIVE',
      levels: [{ approvers: [{}, {}, {}] }],
    });
    const fewerApprovers = buildRule({
      ruleId: 'fewer-approvers',
      priority: 20,
      levels: [{ approvers: [{}] }],
    });

    expect(resolver.resolve([fewerApprovers, moreApprovers]).ruleId).toBe(
      'more-approvers',
    );
  });

  it('FIRST_MATCH: vence a regra criada primeiro (createdAt mais antigo)', () => {
    const older = buildRule({
      ruleId: 'older',
      priority: 20,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    const newer = buildRule({
      ruleId: 'newer',
      priority: 5,
      conflictStrategy: 'FIRST_MATCH',
      createdAt: new Date('2026-06-01T00:00:00Z'),
    });

    // "newer" tem a maior prioridade (número menor) e é quem governa a
    // estratégia (FIRST_MATCH); mas o desempate por "primeira encontrada"
    // olha para createdAt entre todas as regras conflitantes, favorecendo
    // "older" mesmo com prioridade numérica pior.
    expect(resolver.resolve([newer, older]).ruleId).toBe('older');
  });

  it('a estratégia da regra de maior prioridade entre as conflitantes é quem governa o desempate', () => {
    // "older" tem prioridade mais alta (número menor) e declara MOST_RESTRICTIVE;
    // mesmo que "newer" declare HIGHEST_PRIORITY, é a estratégia de "older" que vale.
    const older = buildRule({
      ruleId: 'older',
      priority: 5,
      conflictStrategy: 'MOST_RESTRICTIVE',
      levels: [{ approvers: [{}] }],
    });
    const newer = buildRule({
      ruleId: 'newer',
      priority: 20,
      conflictStrategy: 'HIGHEST_PRIORITY',
      levels: [{ approvers: [{}] }, { approvers: [{}] }],
    });

    expect(resolver.resolve([older, newer]).ruleId).toBe('newer');
  });
});
