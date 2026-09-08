import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { RecentActivityDto } from '../dtos/dashboard-filters.dto';
import { DashboardService } from '../services/dashboard.service';

@Injectable()
export class GetRecentActivityUseCase {
  constructor(private readonly dashboardService: DashboardService) {}

  execute(user: AuthenticatedUser, query: RecentActivityDto) {
    return this.dashboardService.getRecentActivity(user, query);
  }
}
