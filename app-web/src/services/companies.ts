import { internalApiClient } from './api';
import type { Company } from '@/lib/mock/types';

export async function getCompanies(): Promise<Company[]> {
  const { data } = await internalApiClient.get<Company[]>('/company');
  return data;
}
