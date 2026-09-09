import { AxiosError } from 'axios';
import { redirect } from 'next/navigation';

import { internalApiClient } from '@/services/api';
import { getAuthenticatedBackendToken } from './backendAuth';

// Server Components call this directly during render, so a 401 here (session
// still valid, but the backend JWT expired or was invalidated) must not
// surface as an unhandled exception — that crashes the whole page instead of
// sending the user back to sign in.
export async function getFromBackend<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const token = await getAuthenticatedBackendToken();

  try {
    const { data } = await internalApiClient.get<T>(path, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    return data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      redirect('/login');
    }

    throw error;
  }
}
