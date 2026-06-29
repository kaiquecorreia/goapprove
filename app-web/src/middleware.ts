import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

import {
  ERoutePath,
  EUserRole,
  ROLE_DEFAULT_ROUTE,
  canAccessRoute,
  isPrivatePath,
  isPublicPath,
} from './config/navigation';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isAuthenticated = !!req.nextauth.token;
    const role = req.nextauth.token?.role as EUserRole | undefined;

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
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  },
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|logo\\.png|perfil\\.jpeg).*)'],
};
