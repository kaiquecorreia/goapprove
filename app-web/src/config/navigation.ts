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
  OCS_PENDING = '/ocs/pending',
  HISTORY = '/history',
  RULES = '/rules',
  USERS = '/users',
  COMPANIES = '/companies',
  AUDIT = '/audit',
}

export const ROUTES: RoutesType = {
  [ERouteType.PUBLIC]: [ERoutePath.LOGIN, ERoutePath.LOGIN_INFOR],
  [ERouteType.PRIVATE]: [
    ERoutePath.HOME,
    ERoutePath.ONBOARDING,
    ERoutePath.OCS_PENDING,
    ERoutePath.HISTORY,
    ERoutePath.RULES,
    ERoutePath.USERS,
    ERoutePath.COMPANIES,
    ERoutePath.AUDIT,
  ],
};

// Private dynamic routes that don't fit the ERoutePath enum (e.g. /ocs/[id])
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
      { name: 'OCs Pendentes', href: ERoutePath.OCS_PENDING, icon: Inbox },
      { name: 'Histórico', href: ERoutePath.HISTORY, icon: History },
    ],
  },
  {
    label: 'Configuração',
    items: [
      { name: 'Regras de Negócio', href: ERoutePath.RULES, icon: GitBranch },
      { name: 'Usuários', href: ERoutePath.USERS, icon: Users },
      { name: 'Empresas', href: ERoutePath.COMPANIES, icon: Building2 },
    ],
  },
  {
    label: 'Governança',
    items: [{ name: 'Auditoria', href: ERoutePath.AUDIT, icon: ShieldCheck }],
  },
];
