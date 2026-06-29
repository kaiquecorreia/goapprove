import {
  LucideIcon,
  LayoutDashboard,
  Inbox,
  History,
  GitBranch,
  Users,
  Building2,
  ShieldCheck,
} from 'lucide-react';

type RoutesType = {
  [ERouteType.PUBLIC]: string[];
  [ERouteType.PRIVATE]: string[];
};

export enum ERouteType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum ERoutePath {
  HOME = '/',
  LOGIN = '/login',
  LOGIN_INFOR = '/login/infor',
  ONBOARDING = '/onboarding',
  OCS_PENDENTES = '/ocs/pendentes',
  HISTORICO = '/historico',
  REGRAS = '/regras',
  USUARIOS = '/usuarios',
  EMPRESAS = '/empresas',
  AUDITORIA = '/auditoria',
}

export const ROUTES: RoutesType = {
  [ERouteType.PUBLIC]: [ERoutePath.LOGIN, ERoutePath.LOGIN_INFOR],
  [ERouteType.PRIVATE]: [
    ERoutePath.HOME,
    ERoutePath.ONBOARDING,
    ERoutePath.OCS_PENDENTES,
    ERoutePath.HISTORICO,
    ERoutePath.REGRAS,
    ERoutePath.USUARIOS,
    ERoutePath.EMPRESAS,
    ERoutePath.AUDITORIA,
  ],
};

// Rotas dinâmicas privadas que não cabem no enum ERoutePath (ex: /ocs/[id])
const PRIVATE_PATH_PREFIXES = ['/ocs/'];

export function isPublicPath(path: string): boolean {
  return ROUTES[ERouteType.PUBLIC].includes(path);
}

export function isPrivatePath(path: string): boolean {
  if (ROUTES[ERouteType.PRIVATE].includes(path)) return true;
  return PRIVATE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export type NavigationItem = {
  name: string;
  href: ERoutePath;
  icon: LucideIcon;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Operação',
    items: [
      { name: 'Dashboard', href: ERoutePath.HOME, icon: LayoutDashboard },
      { name: 'OCs Pendentes', href: ERoutePath.OCS_PENDENTES, icon: Inbox },
      { name: 'Histórico', href: ERoutePath.HISTORICO, icon: History },
    ],
  },
  {
    label: 'Configuração',
    items: [
      { name: 'Regras de Negócio', href: ERoutePath.REGRAS, icon: GitBranch },
      { name: 'Usuários', href: ERoutePath.USUARIOS, icon: Users },
      { name: 'Empresas', href: ERoutePath.EMPRESAS, icon: Building2 },
    ],
  },
  {
    label: 'Governança',
    items: [{ name: 'Auditoria', href: ERoutePath.AUDITORIA, icon: ShieldCheck }],
  },
];
