import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { DashboardFiltersDto } from '../dtos/dashboard-filters.dto';
import { DashboardService } from '../services/dashboard.service';

@Injectable()
export class GetDashboardKpisUseCase {
  constructor(private readonly dashboardService: DashboardService) {}

  execute(user: AuthenticatedUser, query: DashboardFiltersDto) {
    return this.dashboardService.getKpis(user, query);
  }
}
