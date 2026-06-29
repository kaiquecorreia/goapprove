import { mockCompanies } from '@/lib/mock';
import type { Company } from '@/lib/mock/types';

export function getCompanies(): Company[] {
  return mockCompanies;
}
