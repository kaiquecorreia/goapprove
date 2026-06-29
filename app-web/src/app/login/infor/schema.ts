import { z } from 'zod';

export const loginInforSchema = z.object({
  externalIntegrationUser: z.string().min(1, 'Informe seu usuário cadastrado'),
});

export type LoginInforFormData = z.infer<typeof loginInforSchema>;
