import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  CompanyDistributionRow,
  DashboardCriteria,
  DashboardRepository,
  MonthlyTrendRow,
  RecentActivityRow,
  StatusBucket,
} from './dashboard.repository';

// Raw shape of the monthly trend query. COUNT() comes back as bigint through the
// pg driver adapter, and generate_series yields a Date — both are normalized
// before leaving the repository.
interface RawMonthlyTrendRow {
  month: Date;
  approved: bigint;
  rejected: bigint;
  no_rule: bigint;
}

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async countByStatus(criteria: DashboardCriteria): Promise<StatusBucket[]> {
    const grouped = await this.prismaService.getClient().purchaseOrder.groupBy({
      by: ['status'],
      where: this.purchaseOrderWhere(criteria),
      _count: { _all: true },
      _sum: { totalAmount: true },
    });

    return grouped.map((row) => ({
      status: row.status,
      count: row._count._all,
      amount: row._sum.totalAmount?.toFixed(2) ?? '0.00',
    }));
  }

  // Empty months are filled by generate_series so the chart's X axis always
  // spans the full period instead of collapsing to the months that have data.
  //
  // Bucketing uses erp_created_at as stored (the column is a timestamp without
  // time zone), so months are UTC-aligned rather than America/Sao_Paulo-aligned.
  async findMonthlyTrend(
    criteria: DashboardCriteria,
  ): Promise<MonthlyTrendRow[]> {
    const rows = await this.prismaService.getClient().$queryRaw<
      RawMonthlyTrendRow[]
    >`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', ${criteria.dateFrom}::timestamp),
          date_trunc('month', ${criteria.dateTo}::timestamp),
          interval '1 month'
        ) AS month
      )
      SELECT
        m.month AS month,
        COUNT(po.purchase_order_id) FILTER (WHERE po.status = 'APPROVED') AS approved,
        COUNT(po.purchase_order_id) FILTER (WHERE po.status = 'REJECTED') AS rejected,
        COUNT(po.purchase_order_id) FILTER (WHERE po.status = 'NO_RULE')  AS no_rule
      FROM months m
      LEFT JOIN purchase_orders po
        -- A half-open range on the raw column keeps this sargable, unlike
        -- date_trunc(po.erp_created_at) = m.month which would defeat the index.
        ON po.erp_created_at >= m.month
       AND po.erp_created_at < m.month + interval '1 month'
       AND po.erp_created_at >= ${criteria.dateFrom}
       AND po.erp_created_at <= ${criteria.dateTo}
       ${this.rawCompanyFilter(criteria)}
      GROUP BY m.month
      ORDER BY m.month
    `;

    return rows.map((row) => ({
      month: row.month.toISOString().slice(0, 10),
      approved: Number(row.approved),
      rejected: Number(row.rejected),
      noRule: Number(row.no_rule),
    }));
  }

  async findCompanyDistribution(
    criteria: DashboardCriteria & { take: number },
  ): Promise<CompanyDistributionRow[]> {
    const client = this.prismaService.getClient();

    const grouped = await client.purchaseOrder.groupBy({
      by: ['companyId'],
      where: this.purchaseOrderWhere(criteria),
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { companyId: 'desc' } },
      take: criteria.take,
    });

    if (grouped.length === 0) {
      return [];
    }

    // One extra query to resolve the names, rather than a join per group row.
    const companies = await client.company.findMany({
      where: { companyId: { in: grouped.map((row) => row.companyId) } },
      select: { companyId: true, name: true },
    });
    const namesById = new Map(companies.map((c) => [c.companyId, c.name]));

    return grouped.map((row) => ({
      companyId: row.companyId,
      name: namesById.get(row.companyId) ?? 'Empresa desconhecida',
      count: row._count._all,
      amount: row._sum.totalAmount?.toFixed(2) ?? '0.00',
    }));
  }

  // Reads from approval_workflows rather than purchase_orders: "recent activity"
  // means a decision was taken, and finalizedAt is the timestamp for that.
  async findRecentActivity(
    criteria: DashboardCriteria & { take: number },
  ): Promise<RecentActivityRow[]> {
    const workflows = await this.prismaService
      .getClient()
      .approvalWorkflow.findMany({
        where: {
          status: { in: ['APPROVED', 'REJECTED'] },
          finalizedAt: { not: null },
          purchaseOrder: this.purchaseOrderWhere(criteria),
        },
        // Narrow select on purpose — this feeds a 6-row list, not a detail view.
        select: {
          finalizedAt: true,
          purchaseOrder: {
            select: {
              purchaseOrderId: true,
              orderNumber: true,
              supplierName: true,
              requesterName: true,
              totalAmount: true,
              status: true,
            },
          },
        },
        orderBy: { finalizedAt: 'desc' },
        take: criteria.take,
      });

    return workflows.map((workflow) => ({
      purchaseOrderId: workflow.purchaseOrder.purchaseOrderId,
      orderNumber: workflow.purchaseOrder.orderNumber,
      supplierName: workflow.purchaseOrder.supplierName,
      requesterName: workflow.purchaseOrder.requesterName,
      totalAmount: workflow.purchaseOrder.totalAmount.toFixed(2),
      status: workflow.purchaseOrder.status,
      // Non-null by the `finalizedAt: { not: null }` filter above.
      finalizedAt: workflow.finalizedAt as Date,
    }));
  }

  private purchaseOrderWhere(
    criteria: DashboardCriteria,
  ): Prisma.PurchaseOrderWhereInput {
    return {
      ...(criteria.companyId && { companyId: criteria.companyId }),
      ...(criteria.companyIds && { companyId: { in: criteria.companyIds } }),
      erpCreatedAt: { gte: criteria.dateFrom, lte: criteria.dateTo },
    };
  }

  // Neither field set => unrestricted (ADMINISTRATOR). DashboardService never
  // passes an empty companyIds array; it short-circuits that case instead.
  private rawCompanyFilter(criteria: DashboardCriteria): Prisma.Sql {
    if (criteria.companyId) {
      return Prisma.sql`AND po.company_id = ${criteria.companyId}::uuid`;
    }

    if (criteria.companyIds) {
      return Prisma.sql`AND po.company_id IN (${Prisma.join(
        criteria.companyIds.map((id) => Prisma.sql`${id}::uuid`),
      )})`;
    }

    return Prisma.empty;
  }
}
