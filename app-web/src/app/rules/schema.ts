import { z } from 'zod';

export const APPROVAL_MODES = ['ANY', 'ALL', 'SEQUENTIAL'] as const;
export const SOURCE_TYPES = ['PO_HEADER', 'PO_LINE', 'PO_ADDITIONAL'] as const;
export const OPERATORS = [
  'EQUALS',
  'NOT_EQUALS',
  'GREATER_THAN',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN',
  'LESS_THAN_OR_EQUAL',
  'BETWEEN',
  'CONTAINS',
  'IN_LIST',
  'NOT_IN_LIST',
  'EXISTS',
  'NOT_EXISTS',
] as const;
export const CONFLICT_STRATEGY_OPTIONS = [
  'HIGHEST_PRIORITY',
  'MOST_RESTRICTIVE',
  'FIRST_MATCH',
] as const;

const NO_VALUE_OPERATORS = new Set(['EXISTS', 'NOT_EXISTS', 'BETWEEN', 'IN_LIST', 'NOT_IN_LIST']);

export const criterionSchema = z
  .object({
    sourceType: z.enum(SOURCE_TYPES),
    field: z.string().min(1, 'Informe o campo'),
    operator: z.enum(OPERATORS),
    value: z.string().optional(),
    valueTo: z.string().optional(),
    valueList: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.operator === 'BETWEEN' && !data.valueTo) {
      ctx.addIssue({ code: 'custom', path: ['valueTo'], message: 'Informe o valor final' });
    }
    if ((data.operator === 'IN_LIST' || data.operator === 'NOT_IN_LIST') && !data.valueList) {
      ctx.addIssue({ code: 'custom', path: ['valueList'], message: 'Informe a lista de valores' });
    }
    if (!NO_VALUE_OPERATORS.has(data.operator) && !data.value) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Informe um valor' });
    }
  });

export const levelSchema = z.object({
  mode: z.enum(APPROVAL_MODES),
  approverUserIds: z.array(z.string()).min(1, 'Selecione ao menos um aprovador'),
});

export const ruleSchema = z.object({
  code: z.string().min(1, 'Informe o código da regra'),
  name: z.string().min(3, 'Informe o nome da regra'),
  description: z.string().optional(),
  companyId: z.string().min(1, 'Selecione a empresa'),
  priority: z.coerce.number().min(1, 'Informe uma prioridade'),
  validFrom: z.string().min(1, 'Informe a data de início'),
  validTo: z.string().optional(),
  conflictStrategy: z.enum(CONFLICT_STRATEGY_OPTIONS),
  criteria: z.array(criterionSchema).min(1, 'Adicione ao menos um critério'),
  levels: z.array(levelSchema).min(1, 'Adicione ao menos um nível de aprovação'),
});

export type RuleFormData = z.infer<typeof ruleSchema>;
