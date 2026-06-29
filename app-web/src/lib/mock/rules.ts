import type { Rule } from './types';

export const mockRules: Rule[] = [
  {
    id: 'rule-1',
    name: 'OC acima de R$ 100k — 2 níveis',
    priority: 10,
    validFrom: '2026-01-01',
    criteria: [{ field: 'Valor da OC', operator: '>', value: '100000' }],
    levels: [
      { level: 1, mode: 'ANY', approvers: ['Bruno Henrique Lima', 'Carla Mendes'] },
      { level: 2, mode: 'ALL', approvers: ['Ana Carolina Souza'] },
    ],
    conflictStrategy: 'Maior prioridade',
    status: 'Ativa',
  },
  {
    id: 'rule-2',
    name: 'Categoria TI — aprovação técnica',
    priority: 20,
    validFrom: '2026-01-01',
    criteria: [{ field: 'Categoria', operator: 'Igual', value: 'TI' }],
    levels: [{ level: 1, mode: 'ALL', approvers: ['Eduarda Ribeiro'] }],
    conflictStrategy: 'Mais restritiva',
    status: 'Ativa',
  },
  {
    id: 'rule-3',
    name: 'Fornecedor estratégico — fast track',
    priority: 5,
    validFrom: '2026-01-01',
    criteria: [{ field: 'Fornecedor', operator: 'Em lista', value: 'TI Solutions S.A.' }],
    levels: [{ level: 1, mode: 'ANY', approvers: ['Gabriela Tavares'] }],
    conflictStrategy: 'Primeira encontrada',
    status: 'Ativa',
  },
  {
    id: 'rule-4',
    name: 'Centro de custo MKT — bloqueio acima de 50k',
    priority: 15,
    validFrom: '2025-06-01',
    validTo: '2025-12-31',
    criteria: [
      { field: 'Centro de custo', operator: 'Igual', value: 'MKT' },
      { field: 'Valor da OC', operator: '>', value: '50000' },
    ],
    levels: [{ level: 1, mode: 'ALL', approvers: ['Ana Carolina Souza'] }],
    conflictStrategy: 'Maior prioridade',
    status: 'Inativa',
  },
];

export const RULE_FIELDS = [
  'Empresa',
  'Valor da OC',
  'Fornecedor',
  'Solicitante',
  'Comprador',
  'Centro de custo',
  'Categoria',
  'Item',
  'Projeto',
];

export const RULE_OPERATORS = [
  'Igual',
  'Diferente',
  '>',
  '<',
  '>=',
  '<=',
  'Entre',
  'Contém',
  'Em lista',
  'Não em lista',
  'Existe',
  'Não existe',
];

export const CONFLICT_STRATEGIES = ['Maior prioridade', 'Mais restritiva', 'Primeira encontrada'];
