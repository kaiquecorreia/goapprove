import { z } from 'zod';
import { EUserRole } from '@/config/navigation';

export const USER_ROLE_OPTIONS = [
  EUserRole.OWNER,
  EUserRole.ADMINISTRATOR,
  EUserRole.APPROVER,
  EUserRole.VIEWER,
  EUserRole.RULES_MANAGER,
  EUserRole.EXTERNAL_INTEGRATION,
] as const;

export const userSchema = z
  .object({
    name: z.string().min(1, 'Informe o nome completo').max(150, 'Máximo de 150 caracteres'),
    email: z.string().email('E-mail inválido').max(150, 'Máximo de 150 caracteres'),
    externalIntegrationUser: z
      .string()
      .min(1, 'Informe o usuário de integração')
      .max(50, 'Máximo de 50 caracteres'),
    role: z.nativeEnum(EUserRole, { errorMap: () => ({ message: 'Selecione um perfil' }) }),
    active: z.boolean(),
    approvalLimit: z.coerce.number().min(0, 'Informe um valor válido'),
    companyIds: z.array(z.string()),
    substituteIds: z.array(z.string()),
  })
  .refine((data) => data.role === EUserRole.ADMINISTRATOR || data.companyIds.length > 0, {
    message: 'Selecione ao menos uma empresa',
    path: ['companyIds'],
  });

export type UserFormData = z.infer<typeof userSchema>;
