import { cache } from 'react';
import { Session } from 'next-auth';

import { internalApiClient } from '@/services/api';
import { requireSession } from './apiAuth';

interface BackendTokenResponse {
  accessToken: string;
}

// The rules/workflow endpoints validate a per-user backend JWT (in addition to
// the shared internal-api-key already attached by internalApiClient). The BFF
// mints one here from the session's externalIntegrationUser before proxying
// the request, so the backend can identify who is acting.
//
// Wrapped in React's cache() so concurrent callers within the same request
// (e.g. a page firing off several Promise.all'd service calls) share one
// /auth/callback round trip instead of each minting their own token.
export const getBackendAccessToken = cache(
  async (externalIntegrationUser: string): Promise<string> => {
    const { data } = await internalApiClient.post<BackendTokenResponse>('/auth/callback', {
      externalIntegrationUser,
    });

    return data.accessToken;
  },
);

// Password-based (Credentials) sessions already carry our own backend JWT from
// sign-in time, so it's used directly. Infor sessions' `accessToken` (if any)
// is the *Infor* OAuth token, not ours — they double-hop through
// /auth/callback. Both kinds now carry `externalIntegrationUser`, so the
// login method is told apart by `authMethod`, never by that field.
export async function resolveBackendAccessToken(session: Session): Promise<string> {
  if (session.authMethod === 'credentials' && session.accessToken) {
    return session.accessToken;
  }

  if (session.externalIntegrationUser) {
    return getBackendAccessToken(session.externalIntegrationUser);
  }

  if (session.accessToken) {
    return session.accessToken;
  }

  throw new Error('Sessão sem credenciais de backend válidas');
}

// For server components/services (not Route Handlers) that need the backend
// token directly. These run on pages already gated by middleware.ts, so a
// failure here is exceptional and should surface as an error, not silently
// degrade (e.g. an empty list) — see services/rules.ts, users.ts, companies.ts.
export async function getAuthenticatedBackendToken(): Promise<string> {
  const session = await requireSession();

  if (!session) {
    throw new Error('Sessão não encontrada');
  }

  return resolveBackendAccessToken(session);
}
