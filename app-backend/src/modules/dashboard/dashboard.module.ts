import { Module } from '@nestjs/common';

import { AppJwtModule } from '../../shared/jwt/app-jwt.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CompanyModule } from '../company/company.module';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './repositories/dashboard.repository';
import { PrismaDashboardRepository } from './repositories/prisma-dashboard.repository';
import { DashboardService } from './services/dashboard.service';
import { GetCompanyDistributionUseCase } from './use-cases/get-company-distribution.use-case';
import { GetDashboardKpisUseCase } from './use-cases/get-dashboard-kpis.use-case';
import { GetMonthlyTrendUseCase } from './use-cases/get-monthly-trend.use-case';
import { GetRecentActivityUseCase } from './use-cases/get-recent-activity.use-case';

@Module({
  imports: [PrismaModule, AppJwtModule, CompanyModule],
  controllers: [DashboardController],
  providers: [
    PrismaService,
    DashboardService,
    GetDashboardKpisUseCase,
    GetMonthlyTrendUseCase,
    GetCompanyDistributionUseCase,
    GetRecentActivityUseCase,
    { provide: DashboardRepository, useClass: PrismaDashboardRepository },
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
