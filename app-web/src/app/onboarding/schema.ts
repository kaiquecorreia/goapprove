import { z } from 'zod';

export const integrationSchema = z.object({
  baseUrl: z.string().min(1, 'Informe a URL base da Infor'),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
});

export type IntegrationFormData = z.infer<typeof integrationSchema>;
