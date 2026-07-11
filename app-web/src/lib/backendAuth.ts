import { internalApiClient } from '@/services/api';

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
