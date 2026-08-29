import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

import {
  ERoutePath,
  EUserRole,
  ROLE_DEFAULT_ROUTE,
  canAccessRoute,
  isPrivatePath,
  isPublicPath,
  resolveApiRoutePath,
} from './config/navigation';

function unauthorizedApiResponse() {
  return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isAuthenticated = !!req.nextauth.token;
    const role = req.nextauth.token?.role as EUserRole | undefined;

    if (pathname.startsWith('/api/')) {
      // NextAuth needs these reachable before/during login (csrf, callback, session...)
      if (pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
      }

      if (pathname.startsWith('/api/integration')) {
        const allowed =
          isAuthenticated &&
          !!req.nextauth.token?.companyId &&
          !!req.nextauth.token?.externalIntegrationUser &&
          (role === EUserRole.OWNER || role === EUserRole.ADMINISTRATOR);

        return allowed ? NextResponse.next() : unauthorizedApiResponse();
      }

      const requiredRoutePath = resolveApiRoutePath(pathname);
      const allowed =
        isAuthenticated && !!role && !!requiredRoutePath && canAccessRoute(role, requiredRoutePath);

      return allowed ? NextResponse.next() : unauthorizedApiResponse();
    }

    if (pathname === ERoutePath.LOGIN && isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (role && isPrivatePath(pathname) && !canAccessRoute(role, pathname)) {
      return NextResponse.redirect(new URL(ROLE_DEFAULT_ROUTE[role], req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        if (isPublicPath(pathname)) return true;
        if (pathname.startsWith('/api/')) return true;
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  },
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|favicon\\.ico|logo\\.png|perfil\\.jpeg).*)'],
};
