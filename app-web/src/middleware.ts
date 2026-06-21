import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isPrivatePath, isPublicPath } from './config/navigation';

/**
 * Create a redirect URL with optional redirect parameter
 */
function createRedirectUrl(path: string, baseUrl: string, redirectPath?: string): URL {
  const url = new URL(path, baseUrl);
  if (redirectPath) {
    url.searchParams.set('redirect', redirectPath);
  }
  return url;
}

/**
 * Get authentication status from request
 */
function hasCorrectAuthorizationCookie(request: NextRequest): boolean {
  const rawToken = request.cookies.get('auth-token')?.value?.trim();
  if (!rawToken) return false;
  if (rawToken === 'undefined' || rawToken === 'null') return false;
  const jwtSegments = rawToken.split('.');
  return jwtSegments.length === 3;
}

/**
 * Handle invalid route based on auth status
 */
function handleInvalidRoute(request: NextRequest, isAuthenticated: boolean): NextResponse {
  if (!isAuthenticated) {
    return NextResponse.redirect(createRedirectUrl('/login', request.url, '/'));
  }
  return NextResponse.rewrite(new URL('/_not-found', request.url));
}

/** Auth/marketing pages where a logged-in user is redirected away. */
const REDIRECT_AUTHENTICATED_AWAY_FROM = new Set(['/login']);

function shouldRedirectAuthenticatedPublicUser(path: string): boolean {
  return REDIRECT_AUTHENTICATED_AWAY_FROM.has(path);
}

/**
 * Handle authenticated user trying to access public routes (only specific entry pages).
 */
function handleAuthenticatedPublicAccess(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/', request.url));
}

/**
 * Handle unauthenticated user trying to access private routes
 */
function handleUnauthenticatedPrivateAccess(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(createRedirectUrl('/login', request.url, path));
}

/** Files in /public — bypass auth so the browser can load media, fonts, etc. */
const PUBLIC_STATIC_FILE =
  /\.(?:webm|mp4|mov|m4v|ogv|ico|png|jpe?g|gif|svg|webp|woff2?|ttf|otf|mp3|wav|json|xml|txt|pdf)$/i;

export function middleware(request: NextRequest): NextResponse {
  const path = request.nextUrl.pathname;
  if (PUBLIC_STATIC_FILE.test(path)) {
    return NextResponse.next();
  }
  const hasCorrectAuthCookie = hasCorrectAuthorizationCookie(request);

  const isPublicRoute = isPublicPath(path);
  const isValidPrivateRoute = isPrivatePath(path);

  if (!isPublicRoute && !isValidPrivateRoute) {
    return handleInvalidRoute(request, hasCorrectAuthCookie);
  }

  if (!isPublicRoute && !hasCorrectAuthCookie) {
    return handleUnauthenticatedPrivateAccess(request, path);
  }

  if (hasCorrectAuthCookie && isPublicRoute && shouldRedirectAuthenticatedPublicUser(path)) {
    return handleAuthenticatedPublicAccess(request);
  }

  return NextResponse.next();
}

// Configure the paths that middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Static file extensions are skipped in middleware() via PUBLIC_STATIC_FILE.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|perfil.jpeg).*)',
  ],
};
