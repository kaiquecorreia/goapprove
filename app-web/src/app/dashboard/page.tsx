'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KpiCard } from '@/components/domain/KpiCard';
import { MonthlyStatusChart } from '@/components/domain/MonthlyStatusChart';
import { CompanyDistributionChart } from '@/components/domain/CompanyDistributionChart';
import { RecentOcList } from '@/components/domain/RecentOcList';
import { getPurchaseOrders } from '@/services/purchaseOrders';
import { monthlyStats, companyDistribution } from '@/lib/mock/dashboardStats';
import { formatCurrency } from '@/lib/format/currency';
import styles from './styles.module.scss';

export default function DashboardPage() {
  const orders = getPurchaseOrders();

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.status === 'pending');
    const approved = orders.filter((order) => order.status === 'approved');
    const rejected = orders.filter((order) => order.status === 'rejected');
    const totalValue = orders.reduce((sum, order) => sum + order.total, 0);

    return { pending, approved, rejected, totalValue };
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...stats.approved, ...stats.rejected]
        .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
        .slice(0, 6),
    [stats],
  );

  return (
    <div className={styles.page}>
      <PageHeader title="Dashboard" description="Visão geral do fluxo de aprovação de OCs." />

      <div className={styles.kpiGrid}>
        <KpiCard
          title="Pendentes"
          value={String(stats.pending.length)}
          icon={<Clock size={20} />}
          tone="warning"
        />
        <KpiCard
          title="Aprovadas"
          value={String(stats.approved.length)}
          icon={<CheckCircle2 size={20} />}
          tone="success"
        />
        <KpiCard
          title="Rejeitadas"
          value={String(stats.rejected.length)}
          icon={<XCircle size={20} />}
          tone="destructive"
        />
        <KpiCard
          title="Valor total"
          value={formatCurrency(stats.totalValue)}
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
            <CompanyDistributionChart data={companyDistribution} />
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
  );
}
