import { getAuthenticatedBackendToken } from '@/lib/backendAuth';
import { internalApiClient } from './api';
import type {
  CompanyDistributionEntry,
  DashboardKpis,
  MonthlyStat,
  OCStatus,
  RecentActivityItem,
} from '@/lib/mock/types';

export interface DashboardQuery {
  dateFrom: string;
  dateTo: string;
  companyId?: string;
}

// Amounts are Decimal(15, 2) on the backend and travel as strings so no
// precision is lost in transit — same reason toHistoryPurchaseOrder does this.
interface RawKpis {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  noRule: number;
  error: number;
  totalCount: number;
  totalAmount: string;
}

interface RawMonthlyTrendEntry {
  month: string;
  approved: number;
  rejected: number;
  noRule: number;
}

interface RawCompanyDistributionEntry {
  companyId: string | null;
  name: string;
  count: number;
  amount: string;
}

interface RawRecentActivityEntry {
  purchaseOrderId: string;
  orderNumber: string;
  supplierName: string | null;
  requesterName: string | null;
  totalAmount: string;
  status: string;
  finalizedAt: string;
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: 'UTC',
});

// '2026-04-01' -> 'Abr'. The backend stays locale-agnostic and only emits the
// bucket's ISO date.
function toMonthLabel(month: string): string {
  const label = monthFormatter.format(new Date(`${month}T00:00:00.000Z`));
  const withoutDot = label.replace('.', '');

  return withoutDot.charAt(0).toUpperCase() + withoutDot.slice(1);
}

async function get<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const token = await getAuthenticatedBackendToken();
  const { data } = await internalApiClient.get<T>(path, {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

function toParams(query: DashboardQuery): Record<string, string> {
  return {
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    ...(query.companyId && { companyId: query.companyId }),
  };
}

export async function getDashboardKpis(query: DashboardQuery): Promise<DashboardKpis> {
  const raw = await get<RawKpis>('/dashboard/kpis', toParams(query));

  return { ...raw, totalAmount: Number(raw.totalAmount) };
}

export async function getMonthlyTrend(
  query: DashboardQuery & { months: number },
): Promise<MonthlyStat[]> {
  const raw = await get<RawMonthlyTrendEntry[]>('/dashboard/monthly-trend', {
    ...toParams(query),
    months: String(query.months),
  });

  return raw.map((entry) => ({
    month: toMonthLabel(entry.month),
    aprovadas: entry.approved,
    rejeitadas: entry.rejected,
    semRegra: entry.noRule,
  }));
}

export async function getCompanyDistribution(
  query: DashboardQuery,
): Promise<CompanyDistributionEntry[]> {
  const raw = await get<RawCompanyDistributionEntry[]>('/dashboard/company-distribution', {
    ...toParams(query),
    // One slice per chart color token (--chart-1..4).
    limit: '4',
  });

  return raw.map((entry) => ({ name: entry.name, value: entry.count }));
}

export async function getRecentActivity(query: DashboardQuery): Promise<RecentActivityItem[]> {
  const raw = await get<RawRecentActivityEntry[]>('/dashboard/recent-activity', {
    ...toParams(query),
    limit: '6',
  });

  return raw.map((entry) => ({
    id: entry.purchaseOrderId,
    number: entry.orderNumber,
    supplier: entry.supplierName ?? '—',
    requester: entry.requesterName ?? '—',
    total: Number(entry.totalAmount),
    status: entry.status.toLowerCase() as OCStatus,
    finalizedAt: entry.finalizedAt,
  }));
}
