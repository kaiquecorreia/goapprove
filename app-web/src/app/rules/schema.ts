import { z } from 'zod';

export const APPROVAL_MODES = ['ANY', 'ALL', 'SEQUENTIAL'] as const;
export const CONFLICT_STRATEGY_OPTIONS = [
  'Maior prioridade',
  'Mais restritiva',
  'Primeira encontrada',
] as const;

export const criterionSchema = z.object({
  field: z.string().min(1, 'Selecione um campo'),
  operator: z.string().min(1, 'Selecione um operador'),
  value: z.string().min(1, 'Informe um valor'),
});

export const levelSchema = z.object({
  mode: z.enum(APPROVAL_MODES),
  approvers: z.string().min(1, 'Informe ao menos um aprovador'),
});

export const ruleSchema = z.object({
  name: z.string().min(3, 'Informe o nome da regra'),
  priority: z.coerce.number().min(1, 'Informe uma prioridade'),
  validFrom: z.string().min(1, 'Informe a data de início'),
  validTo: z.string().optional(),
  conflictStrategy: z.enum(CONFLICT_STRATEGY_OPTIONS),
  criteria: z.array(criterionSchema).min(1, 'Adicione ao menos um critério'),
  levels: z.array(levelSchema).min(1, 'Adicione ao menos um nível de aprovação'),
});

export type RuleFormData = z.infer<typeof ruleSchema>;
