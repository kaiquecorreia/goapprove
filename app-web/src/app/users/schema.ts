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

const baseUserSchema = z.object({
  name: z.string().min(1, 'Informe o nome completo').max(150, 'Máximo de 150 caracteres'),
  email: z.string().email('E-mail inválido').max(150, 'Máximo de 150 caracteres'),
  externalIntegrationUser: z
    .string()
    .max(50, 'Máximo de 50 caracteres')
    .optional()
    .or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  role: z.nativeEnum(EUserRole, { errorMap: () => ({ message: 'Selecione um perfil' }) }),
  active: z.boolean(),
  approvalLimit: z.coerce.number().min(0, 'Informe um valor válido'),
  companyIds: z.array(z.string()),
  substituteIds: z.array(z.string()),
});

// Password is only required at creation time — editing an existing user goes
// through the dedicated "Definir/resetar senha" flow instead.
export function buildUserSchema(isEditing: boolean) {
  return baseUserSchema
    .refine((data) => data.role === EUserRole.ADMINISTRATOR || data.companyIds.length > 0, {
      message: 'Selecione ao menos uma empresa',
      path: ['companyIds'],
    })
    .refine((data) => isEditing || (data.password ?? '').length >= 8, {
      message: 'A senha deve ter no mínimo 8 caracteres',
      path: ['password'],
    })
    .refine((data) => isEditing || data.password === data.confirmPassword, {
      message: 'As senhas não conferem',
      path: ['confirmPassword'],
    });
}

export type UserFormData = z.infer<typeof baseUserSchema>;
