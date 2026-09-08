import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { MonthlyTrendDto } from '../dtos/dashboard-filters.dto';
import { DashboardService } from '../services/dashboard.service';

@Injectable()
export class GetMonthlyTrendUseCase {
  constructor(private readonly dashboardService: DashboardService) {}

  execute(user: AuthenticatedUser, query: MonthlyTrendDto) {
    return this.dashboardService.getMonthlyTrend(user, query);
  }
}
