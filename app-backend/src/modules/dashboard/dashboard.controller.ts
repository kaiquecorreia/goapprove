import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AuthenticatedUser } from '../../shared/types/authenticated-user';
import {
  CompanyDistributionDto,
  DashboardFiltersDto,
  MonthlyTrendDto,
  RecentActivityDto,
} from './dtos/dashboard-filters.dto';
import { GetCompanyDistributionUseCase } from './use-cases/get-company-distribution.use-case';
import { GetDashboardKpisUseCase } from './use-cases/get-dashboard-kpis.use-case';
import { GetMonthlyTrendUseCase } from './use-cases/get-monthly-trend.use-case';
import { GetRecentActivityUseCase } from './use-cases/get-recent-activity.use-case';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMINISTRATOR)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getDashboardKpisUseCase: GetDashboardKpisUseCase,
    private readonly getMonthlyTrendUseCase: GetMonthlyTrendUseCase,
    private readonly getCompanyDistributionUseCase: GetCompanyDistributionUseCase,
    private readonly getRecentActivityUseCase: GetRecentActivityUseCase,
  ) {}

  @Get('kpis')
  @ApiOperation({
    summary:
      'Purchase order counts per status plus the summed amount, for the requested period and company scope',
  })
  @ApiQuery({ name: 'companyId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'KPIs computed' })
  getKpis(
    @Query() query: DashboardFiltersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getDashboardKpisUseCase.execute(user, query);
  }

  @Get('monthly-trend')
  @ApiOperation({
    summary:
      'Approved / rejected / no-rule purchase order counts bucketed by month, with empty months included',
  })
  @ApiQuery({ name: 'companyId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'months', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Monthly trend computed' })
  getMonthlyTrend(
    @Query() query: MonthlyTrendDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getMonthlyTrendUseCase.execute(user, query);
  }

  @Get('company-distribution')
  @ApiOperation({
    summary:
      'Purchase order volume per company, largest first, with the remainder aggregated into an "Outras" entry',
  })
  @ApiQuery({ name: 'companyId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Company distribution computed' })
  getCompanyDistribution(
    @Query() query: CompanyDistributionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getCompanyDistributionUseCase.execute(user, query);
  }

  @Get('recent-activity')
  @ApiOperation({
    summary:
      'Most recently finalized (approved or rejected) purchase orders in the period',
  })
  @ApiQuery({ name: 'companyId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent activity listed' })
  getRecentActivity(
    @Query() query: RecentActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getRecentActivityUseCase.execute(user, query);
  }
}
