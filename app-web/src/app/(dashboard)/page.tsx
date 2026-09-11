import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { RefreshablePage } from '@/components/ui/RefreshablePage';
import { KpiCard } from '@/components/domain/KpiCard';
import { DashboardFiltersBar } from '@/components/domain/DashboardFiltersBar';
import { MonthlyStatusChart } from '@/components/domain/MonthlyStatusChart';
import { CompanyDistributionChart } from '@/components/domain/CompanyDistributionChart';
import { RecentOcList } from '@/components/domain/RecentOcList';
import { getCompanies } from '@/services/companies';
import {
  getCompanyDistribution,
  getDashboardKpis,
  getMonthlyTrend,
  getRecentActivity,
} from '@/services/dashboard';
import { parsePeriod, resolvePeriod } from '@/lib/dashboardPeriod';
import { formatCurrency } from '@/lib/format/currency';
import styles from './styles.module.scss';

interface HomePageProps {
  searchParams: Promise<{ period?: string; companyId?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { period: rawPeriod, companyId } = await searchParams;
  const period = parsePeriod(rawPeriod);
  const { dateFrom, dateTo, months } = resolvePeriod(period);
  const query = { dateFrom, dateTo, companyId };

  // All five calls share a single /auth/callback round trip: getBackendAccessToken
  // is wrapped in React's cache() (see lib/backendAuth.ts).
  const [kpis, monthlyStats, companyDistribution, recentOrders, companies] = await Promise.all([
    getDashboardKpis(query),
    getMonthlyTrend({ ...query, months }),
    getCompanyDistribution(query),
    getRecentActivity(query),
    getCompanies(),
  ]);

  return (
    <div className={styles.page}>
      <RefreshablePage
        title="Dashboard"
        description="Visão geral do fluxo de aprovação de OCs."
        extraActions={
          <DashboardFiltersBar period={period} companyId={companyId} companies={companies} />
        }
      >
        <div className={styles.stack}>
          <div className={styles.kpiGrid}>
            <KpiCard
              title="Pendentes"
              value={String(kpis.pending)}
              icon={<Clock size={20} />}
              tone="warning"
            />
            <KpiCard
              title="Aprovadas"
              value={String(kpis.approved)}
              icon={<CheckCircle2 size={20} />}
              tone="success"
            />
            <KpiCard
              title="Rejeitadas"
              value={String(kpis.rejected)}
              icon={<XCircle size={20} />}
              tone="destructive"
            />
            <KpiCard
              title="Valor total"
              value={formatCurrency(kpis.totalAmount)}
              icon={<AlertTriangle size={20} />}
              tone="primary"
            />
          </div>

          <div className={styles.chartsGrid}>
            <Card>
              <CardHeader>
                <CardTitle>Tendência mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyStatusChart data={monthlyStats} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por empresa</CardTitle>
              </CardHeader>
              <CardContent>
                {companyDistribution.length > 0 ? (
                  <CompanyDistributionChart data={companyDistribution} />
                ) : (
                  <p className={styles.stateMessage}>Nenhuma OC no período.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atividade recente</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentOcList orders={recentOrders} />
            </CardContent>
          </Card>
        </div>
      </RefreshablePage>
    </div>
  );
}
