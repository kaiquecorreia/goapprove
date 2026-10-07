import { z } from 'zod';

export const integrationSchema = z.object({
  baseUrl: z.string().min(1, 'Informe a URL do SSO da Infor'),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  ionApiUrl: z.string().optional(),
  serviceClientId: z.string().optional(),
  serviceClientSecret: z.string().optional(),
  serviceAccountKey: z.string().optional(),
  serviceAccountSecret: z.string().optional(),
});

export type IntegrationFormData = z.infer<typeof integrationSchema>;
