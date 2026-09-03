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
export async function getBackendAccessToken(externalIntegrationUser: string): Promise<string> {
  const { data } = await internalApiClient.post<BackendTokenResponse>('/auth/callback', {
    externalIntegrationUser,
  });

  return data.accessToken;
}

// Infor sessions have `externalIntegrationUser` set and their `accessToken`
// (if any) is the *Infor* OAuth token, not ours — always double-hop through
// /auth/callback for them, same as before. Password-based (Credentials)
// sessions never get `externalIntegrationUser` set (see lib/auth.ts) and
// already carry our own backend JWT from sign-in time, so we can use it
// directly without minting a new one per request.
export async function resolveBackendAccessToken(session: Session): Promise<string> {
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
