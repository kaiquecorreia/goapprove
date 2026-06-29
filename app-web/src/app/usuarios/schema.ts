import { z } from 'zod';

export const USER_PROFILES = [
  'Administrador',
  'Gestor de Regras',
  'Aprovador',
  'Consulta',
  'Integração LN',
] as const;

export const userSchema = z.object({
  name: z.string().min(3, 'Informe o nome completo'),
  email: z.string().email('E-mail inválido'),
  profile: z.enum(USER_PROFILES, { errorMap: () => ({ message: 'Selecione um perfil' }) }),
  company: z.string().min(1, 'Selecione uma empresa'),
  approvalLimit: z.coerce.number().min(0, 'Informe um valor válido'),
  substitute: z.string().optional(),
  active: z.boolean(),
});

export type UserFormData = z.infer<typeof userSchema>;
