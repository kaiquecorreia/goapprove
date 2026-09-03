import { getAuthenticatedBackendToken } from '@/lib/backendAuth';
import { internalApiClient } from './api';
import type { Company } from '@/lib/mock/types';

export async function getCompanies(): Promise<Company[]> {
  const token = await getAuthenticatedBackendToken();
  const { data } = await internalApiClient.get<Company[]>('/company', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
