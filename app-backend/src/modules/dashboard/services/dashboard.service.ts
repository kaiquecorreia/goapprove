import { ForbiddenException, Injectable } from '@nestjs/common';
import { PurchaseOrderStatus } from '@prisma/client';

import { CompanyAccessService } from '../../company/services/company-access.service';
import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import {
  CompanyDistributionDto,
  DashboardFiltersDto,
  MonthlyTrendDto,
  RecentActivityDto,
} from '../dtos/dashboard-filters.dto';
import {
  DashboardCriteria,
  DashboardRepository,
  DashboardScope,
  MonthlyTrendRow,
  StatusBucket,
} from '../repositories/dashboard.repository';
import { subtractAmounts, sumAmounts } from './decimal-string';

const DEFAULT_MONTHS = 6;
const OTHER_COMPANIES_LABEL = 'Outras';

export interface DashboardKpis {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  noRule: number;
  error: number;
  totalCount: number;
  totalAmount: string;
}

export interface CompanyDistributionEntry {
  companyId: string | null;
  name: string;
  count: number;
  amount: string;
}

export interface RecentActivityEntry {
  purchaseOrderId: string;
  orderNumber: string;
  supplierName: string | null;
  requesterName: string | null;
  totalAmount: string;
  status: PurchaseOrderStatus;
  finalizedAt: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly companyAccessService: CompanyAccessService,
  ) {}

  async getKpis(
    user: AuthenticatedUser,
    query: DashboardFiltersDto,
  ): Promise<DashboardKpis> {
    const criteria = await this.buildCriteria(user, query);

    if (!criteria) {
      return this.pivotKpis([]);
    }

    return this.pivotKpis(
      await this.dashboardRepository.countByStatus(criteria),
    );
  }

  async getMonthlyTrend(
    user: AuthenticatedUser,
    query: MonthlyTrendDto,
  ): Promise<MonthlyTrendRow[]> {
    const criteria = await this.buildCriteria(
      user,
      query,
      query.months ?? DEFAULT_MONTHS,
    );

    // A user with no company memberships gets an empty axis rather than a
    // query that can only ever return zeros.
    if (!criteria) {
      return [];
    }

    return this.dashboardRepository.findMonthlyTrend(criteria);
  }

  async getCompanyDistribution(
    user: AuthenticatedUser,
    query: CompanyDistributionDto,
  ): Promise<CompanyDistributionEntry[]> {
    const criteria = await this.buildCriteria(user, query);

    if (!criteria) {
      return [];
    }

    const limit = query.limit ?? 4;
    // One slice is reserved for the aggregated remainder, so only (limit - 1)
    // companies are listed individually.
    const [top, statusBuckets] = await Promise.all([
      this.dashboardRepository.findCompanyDistribution({
        ...criteria,
        take: limit - 1,
      }),
      this.dashboardRepository.countByStatus(criteria),
    ]);

    const entries: CompanyDistributionEntry[] = top.map((row) => ({
      companyId: row.companyId,
      name: row.name,
      count: row.count,
      amount: row.amount,
    }));

    const grandTotalCount = statusBuckets.reduce(
      (total, bucket) => total + bucket.count,
      0,
    );
    const listedCount = entries.reduce(
      (total, entry) => total + entry.count,
      0,
    );
    const remainderCount = grandTotalCount - listedCount;

    if (remainderCount > 0) {
      const grandTotalAmount = sumAmounts(
        statusBuckets.map((bucket) => bucket.amount),
      );
      const listedAmount = sumAmounts(entries.map((entry) => entry.amount));

      entries.push({
        companyId: null,
        name: OTHER_COMPANIES_LABEL,
        count: remainderCount,
        amount: subtractAmounts(grandTotalAmount, listedAmount),
      });
    }

    return entries;
  }

  async getRecentActivity(
    user: AuthenticatedUser,
    query: RecentActivityDto,
  ): Promise<RecentActivityEntry[]> {
    const criteria = await this.buildCriteria(user, query);

    if (!criteria) {
      return [];
    }

    return this.dashboardRepository.findRecentActivity({
      ...criteria,
      take: query.limit ?? 6,
    });
  }

  // Returns null when the caller has no accessible company at all — every
  // widget then short-circuits to an empty result instead of querying.
  private async buildCriteria(
    user: AuthenticatedUser,
    query: DashboardFiltersDto,
    months = DEFAULT_MONTHS,
  ): Promise<DashboardCriteria | null> {
    const scope = await this.resolveScope(user, query.companyId);

    if (!scope) {
      return null;
    }

    return { ...scope, ...this.resolvePeriod(query, months) };
  }

  // Mirrors WorkflowService.findHistory: `null` from getAccessibleCompanyIds
  // means ADMINISTRATOR (unrestricted), and an explicit companyId is always
  // validated against the caller's memberships before it reaches a query.
  private async resolveScope(
    user: AuthenticatedUser,
    companyId?: string,
  ): Promise<DashboardScope | null> {
    const accessibleCompanyIds =
      await this.companyAccessService.getAccessibleCompanyIds(user);

    if (accessibleCompanyIds === null) {
      return { companyId };
    }

    if (companyId && !accessibleCompanyIds.includes(companyId)) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    if (companyId) {
      return { companyIds: [companyId] };
    }

    if (accessibleCompanyIds.length === 0) {
      return null;
    }

    return { companyIds: accessibleCompanyIds };
  }

  // Explicit bounds win. Otherwise the window is the last `months` months,
  // snapped to the start of the month so the trend chart's first bucket is
  // whole rather than a partial month.
  private resolvePeriod(
    query: DashboardFiltersDto,
    months: number,
  ): { dateFrom: Date; dateTo: Date } {
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    if (query.dateFrom) {
      return { dateFrom: new Date(query.dateFrom), dateTo };
    }

    const dateFrom = new Date(
      Date.UTC(dateTo.getUTCFullYear(), dateTo.getUTCMonth() - (months - 1), 1),
    );

    return { dateFrom, dateTo };
  }

  private pivotKpis(buckets: StatusBucket[]): DashboardKpis {
    const countOf = (status: PurchaseOrderStatus) =>
      buckets.find((bucket) => bucket.status === status)?.count ?? 0;

    return {
      pending: countOf(PurchaseOrderStatus.PENDING),
      approved: countOf(PurchaseOrderStatus.APPROVED),
      rejected: countOf(PurchaseOrderStatus.REJECTED),
      cancelled: countOf(PurchaseOrderStatus.CANCELLED),
      noRule: countOf(PurchaseOrderStatus.NO_RULE),
      error: countOf(PurchaseOrderStatus.ERROR),
      totalCount: buckets.reduce((total, bucket) => total + bucket.count, 0),
      totalAmount: sumAmounts(buckets.map((bucket) => bucket.amount)),
    };
  }
}
