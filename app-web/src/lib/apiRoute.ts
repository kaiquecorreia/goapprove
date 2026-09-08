import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';

import { requireSession, unauthorizedResponse } from './apiAuth';
import { resolveBackendAccessToken } from './backendAuth';
import { resolveOriginContext, runWithOriginContext } from './requestContext';

type AuthContext = { session: Session; token: string };
type RouteHandler<P> = (
  req: NextRequest,
  routeContext: { params: Promise<P> },
  auth: AuthContext,
) => Promise<NextResponse>;

// Every authenticated /api/** route should go through this wrapper instead of
// re-checking the session inline, so session validation and backend-token
// resolution stay in one place (see lib/backendAuth.ts#resolveBackendAccessToken).
export function withAuthenticatedRoute<P = Record<string, string>>(handler: RouteHandler<P>) {
  return async (req: NextRequest, routeContext: { params: Promise<P> }) => {
    const session = await requireSession();

    if (!session) {
      return unauthorizedResponse();
    }

    try {
      const token = await resolveBackendAccessToken(session);
      return await runWithOriginContext(resolveOriginContext(req), () =>
        handler(req, routeContext, { session, token }),
      );
    } catch {
      return unauthorizedResponse();
    }
  };
}
