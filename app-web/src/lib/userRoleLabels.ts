import { EUserRole } from '@/config/navigation';

export const USER_ROLE_LABELS: Record<EUserRole, string> = {
  [EUserRole.OWNER]: 'Proprietário',
  [EUserRole.ADMINISTRATOR]: 'Administrador',
  [EUserRole.APPROVER]: 'Aprovador',
  [EUserRole.VIEWER]: 'Consulta',
  [EUserRole.RULES_MANAGER]: 'Gestor de Regras',
  [EUserRole.EXTERNAL_INTEGRATION]: 'Integração LN',
};
