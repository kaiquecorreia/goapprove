import {
  LucideIcon,
  LayoutDashboard,
  Inbox,
  History,
  GitBranch,
  Users,
  Building2,
  ShieldCheck,
  Plug,
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
  INTEGRATIONS = '/integrations',
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
    ERoutePath.INTEGRATIONS,
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

export enum EUserRole {
  OWNER = 'OWNER',
  ADMINISTRATOR = 'ADMINISTRATOR',
  APPROVER = 'APPROVER',
  VIEWER = 'VIEWER',
  RULES_MANAGER = 'RULES_MANAGER',
  EXTERNAL_INTEGRATION = 'EXTERNAL_INTEGRATION',
}

const ALL_PAGE_ROUTES = [
  ERoutePath.HOME,
  ERoutePath.OCS_PENDING,
  ERoutePath.HISTORY,
  ERoutePath.RULES,
  ERoutePath.USERS,
  ERoutePath.COMPANIES,
  ERoutePath.AUDIT,
  ERoutePath.INTEGRATIONS,
];

export const ROLE_ROUTE_ACCESS: Record<EUserRole, ERoutePath[]> = {
  [EUserRole.OWNER]: ALL_PAGE_ROUTES,
  [EUserRole.ADMINISTRATOR]: ALL_PAGE_ROUTES,
  [EUserRole.APPROVER]: [ERoutePath.OCS_PENDING],
  [EUserRole.VIEWER]: [ERoutePath.HISTORY],
  [EUserRole.RULES_MANAGER]: [ERoutePath.RULES],
  [EUserRole.EXTERNAL_INTEGRATION]: [ERoutePath.COMPANIES],
};

export const ROLE_DEFAULT_ROUTE: Record<EUserRole, ERoutePath> = {
  [EUserRole.OWNER]: ERoutePath.HOME,
  [EUserRole.ADMINISTRATOR]: ERoutePath.HOME,
  [EUserRole.APPROVER]: ERoutePath.OCS_PENDING,
  [EUserRole.VIEWER]: ERoutePath.HISTORY,
  [EUserRole.RULES_MANAGER]: ERoutePath.RULES,
  [EUserRole.EXTERNAL_INTEGRATION]: ERoutePath.COMPANIES,
};

// /ocs/[id] inherits OCS_PENDING's permission (an approver must open a pending OC to act on it)
const DYNAMIC_ROUTE_PARENTS: { prefix: string; parent: ERoutePath }[] = [
  { prefix: '/ocs/', parent: ERoutePath.OCS_PENDING },
];

export function canAccessRoute(role: EUserRole, pathname: string): boolean {
  const allowed = ROLE_ROUTE_ACCESS[role] ?? [];
  if (allowed.includes(pathname as ERoutePath)) return true;
  const dynamicParent = DYNAMIC_ROUTE_PARENTS.find((d) => pathname.startsWith(d.prefix));
  return dynamicParent ? allowed.includes(dynamicParent.parent) : false;
}

export type NavigationItem = {
  name: string;
  href: ERoutePath;
  icon: LucideIcon;
  allowedRoles: EUserRole[];
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Operação',
    items: [
      {
        name: 'Dashboard',
        href: ERoutePath.HOME,
        icon: LayoutDashboard,
        allowedRoles: [EUserRole.OWNER, EUserRole.ADMINISTRATOR],
      },
      {
        name: 'OCs Pendentes',
        href: ERoutePath.OCS_PENDING,
        icon: Inbox,
        allowedRoles: [EUserRole.OWNER, EUserRole.ADMINISTRATOR, EUserRole.APPROVER],
      },
      {
        name: 'Histórico',
        href: ERoutePath.HISTORY,
        icon: History,
        allowedRoles: [EUserRole.OWNER, EUserRole.ADMINISTRATOR, EUserRole.VIEWER],
      },
    ],
  },
  {
    label: 'Configuração',
    items: [
      {
        name: 'Regras de Negócio',
        href: ERoutePath.RULES,
        icon: GitBranch,
        allowedRoles: [EUserRole.OWNER, EUserRole.ADMINISTRATOR, EUserRole.RULES_MANAGER],
      },
      {
        name: 'Usuários',
        href: ERoutePath.USERS,
        icon: Users,
        allowedRoles: [EUserRole.OWNER, EUserRole.ADMINISTRATOR],
      },
      {
        name: 'Empresas',
        href: ERoutePath.COMPANIES,
        icon: Building2,
        allowedRoles: [EUserRole.OWNER, EUserRole.ADMINISTRATOR, EUserRole.EXTERNAL_INTEGRATION],
      },
      {
        name: 'Integrações',
        href: ERoutePath.INTEGRATIONS,
        icon: Plug,
        allowedRoles: [EUserRole.OWNER, EUserRole.ADMINISTRATOR],
      },
    ],
  },
  {
    label: 'Governança',
    items: [
      {
        name: 'Auditoria',
        href: ERoutePath.AUDIT,
        icon: ShieldCheck,
        allowedRoles: [EUserRole.OWNER, EUserRole.ADMINISTRATOR],
      },
    ],
  },
];
