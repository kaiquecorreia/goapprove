import { LucideIcon, LayoutDashboard } from 'lucide-react';

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
}

export const ROUTES: RoutesType = {
  [ERouteType.PUBLIC]: [ERoutePath.LOGIN],
  [ERouteType.PRIVATE]: [ERoutePath.HOME],
};

export function isPublicPath(path: string): boolean {
  return ROUTES[ERouteType.PUBLIC].includes(path);
}

export function isPrivatePath(path: string): boolean {
  return ROUTES[ERouteType.PRIVATE].includes(path);
}

export type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export const mainNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: ERoutePath.HOME,
    icon: LayoutDashboard,
  },
];
