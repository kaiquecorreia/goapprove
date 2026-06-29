import { z } from 'zod';

export const COMPANY_ENVIRONMENT_OPTIONS = ['DEVELOPMENT', 'HOMOLOGATION', 'PRODUCTION'] as const;

export const COMPANY_ENVIRONMENT_LABELS: Record<
  (typeof COMPANY_ENVIRONMENT_OPTIONS)[number],
  string
> = {
  DEVELOPMENT: 'Desenvolvimento',
  HOMOLOGATION: 'Homologação',
  PRODUCTION: 'Produção',
};

export const companySchema = z.object({
  externalIntegrationCode: z
    .string()
    .min(1, 'Informe o código de integração')
    .max(50, 'Máximo de 50 caracteres'),
  name: z.string().min(1, 'Informe o nome da empresa').max(150, 'Máximo de 150 caracteres'),
  environment: z.enum(COMPANY_ENVIRONMENT_OPTIONS, {
    errorMap: () => ({ message: 'Selecione um ambiente' }),
  }),
  cnpj: z
    .string()
    .optional()
    .refine((value) => !value || value.length === 14, 'CNPJ deve ter 14 dígitos'),
  status: z.boolean(),
  externalIntegrationUrlBase: z.string().optional(),
  notes: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
