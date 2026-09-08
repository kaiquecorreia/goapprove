import { PurchaseOrderStatus } from '@prisma/client';

// Company scoping follows the same convention as FindWorkflowsHistoryCriteria:
// both `companyId` and `companyIds` omitted => unrestricted (ADMINISTRATOR).
// DashboardService.resolveScope is the only place allowed to build this.
export interface DashboardScope {
  companyId?: string;
  companyIds?: string[];
}

export interface DashboardPeriod {
  dateFrom: Date;
  dateTo: Date;
}

export type DashboardCriteria = DashboardScope & DashboardPeriod;

export interface StatusBucket {
  status: PurchaseOrderStatus;
  count: number;
  // Prisma Decimal is serialized as a string all the way to the frontend, which
  // does the Number() conversion (same as toHistoryPurchaseOrder). Summing in JS
  // here would lose precision on large totals.
  //
  // Always two decimal places: Decimal.toString() would emit '25001.5', which
  // makes the amounts across endpoints inconsistent for the same value.
  amount: string;
}

export interface MonthlyTrendRow {
  // First day of the bucketed month, ISO date (e.g. '2026-04-01').
  month: string;
  approved: number;
  rejected: number;
  noRule: number;
}

export interface CompanyDistributionRow {
  companyId: string;
  name: string;
  count: number;
  amount: string;
}

export interface RecentActivityRow {
  purchaseOrderId: string;
  orderNumber: string;
  supplierName: string | null;
  requesterName: string | null;
  totalAmount: string;
  status: PurchaseOrderStatus;
  finalizedAt: Date;
}

export abstract class DashboardRepository {
  // One groupBy over purchase_orders — the service pivots the (at most 6) rows
  // into the KPI shape. Never loads PO rows into memory.
  abstract countByStatus(criteria: DashboardCriteria): Promise<StatusBucket[]>;

  // Buckets by month with empty months filled in SQL, so the chart's X axis
  // always spans the full period.
  abstract findMonthlyTrend(
    criteria: DashboardCriteria,
  ): Promise<MonthlyTrendRow[]>;

  // Top `take` companies by PO count. The caller aggregates the remainder into
  // an "Outras" entry using `totalCount`.
  abstract findCompanyDistribution(
    criteria: DashboardCriteria & { take: number },
  ): Promise<CompanyDistributionRow[]>;

  // Finalized workflows (approved/rejected), most recent decision first.
  abstract findRecentActivity(
    criteria: DashboardCriteria & { take: number },
  ): Promise<RecentActivityRow[]>;
}
