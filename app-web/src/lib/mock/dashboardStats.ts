import type { CompanyDistributionEntry, MonthlyStat } from './types';

export const monthlyStats: MonthlyStat[] = [
  { month: 'Jan', aprovadas: 18, rejeitadas: 4, semRegra: 2 },
  { month: 'Fev', aprovadas: 22, rejeitadas: 3, semRegra: 1 },
  { month: 'Mar', aprovadas: 19, rejeitadas: 5, semRegra: 3 },
  { month: 'Abr', aprovadas: 25, rejeitadas: 2, semRegra: 1 },
  { month: 'Mai', aprovadas: 21, rejeitadas: 6, semRegra: 2 },
  { month: 'Jun', aprovadas: 27, rejeitadas: 3, semRegra: 1 },
];

export const companyDistribution: CompanyDistributionEntry[] = [
  { name: 'Indústria Norte S.A.', value: 38 },
  { name: 'Logística Sul Ltda.', value: 27 },
  { name: 'Tech Centro S.A.', value: 22 },
  { name: 'Comércio Leste Ltda.', value: 13 },
];
