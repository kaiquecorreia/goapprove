'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Select } from '@/components/ui/Select';
import { PERIOD_OPTIONS, type DashboardPeriod } from '@/lib/dashboardPeriod';
import type { Company } from '@/lib/mock/types';
import styles from './styles.module.scss';

interface DashboardFiltersBarProps {
  period: DashboardPeriod;
  companyId?: string;
  companies: Company[];
}

const ALL_COMPANIES = 'all';

// Filters live in the URL so the page stays a Server Component: changing one
// pushes new searchParams and Next re-renders on the server with fresh data.
export function DashboardFiltersBar({ period, companyId, companies }: DashboardFiltersBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = (next: { period?: string; companyId?: string }) => {
    const params = new URLSearchParams();
    params.set('period', next.period ?? period);

    const nextCompanyId = next.companyId ?? companyId;
    if (nextCompanyId && nextCompanyId !== ALL_COMPANIES) {
      params.set('companyId', nextCompanyId);
    }

    startTransition(() => router.push(`/?${params.toString()}`));
  };

  return (
    <div className={styles.bar} aria-busy={isPending}>
      {companies.length > 1 && (
        <Select
          aria-label="Empresa"
          value={companyId ?? ALL_COMPANIES}
          disabled={isPending}
          onChange={(event) => push({ companyId: event.target.value })}
          options={[
            { value: ALL_COMPANIES, label: 'Todas as empresas' },
            ...companies.map((company) => ({
              value: company.companyId,
              label: company.name,
            })),
          ]}
        />
      )}

      <Select
        aria-label="Período"
        value={period}
        disabled={isPending}
        onChange={(event) => push({ period: event.target.value })}
        options={PERIOD_OPTIONS}
      />
    </div>
  );
}
