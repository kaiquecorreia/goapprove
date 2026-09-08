import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CompanyDistributionDto } from '../dtos/dashboard-filters.dto';
import { DashboardService } from '../services/dashboard.service';

@Injectable()
export class GetCompanyDistributionUseCase {
  constructor(private readonly dashboardService: DashboardService) {}

  execute(user: AuthenticatedUser, query: CompanyDistributionDto) {
    return this.dashboardService.getCompanyDistribution(user, query);
  }
}
