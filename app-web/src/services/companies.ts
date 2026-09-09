import { getFromBackend } from '@/lib/backendClient';
import type { Company } from '@/lib/mock/types';

export async function getCompanies(): Promise<Company[]> {
  return getFromBackend<Company[]>('/company');
}
