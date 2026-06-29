import { Injectable } from '@nestjs/common';

import { OnboardingService } from '../services/onboarding.service';

@Injectable()
export class GetCompanyIntegrationUseCase {
  constructor(private readonly onboardingService: OnboardingService) {}

  execute(companyId: string, actingExternalIntegrationUser: string) {
    return this.onboardingService.getCompanyIntegration(
      companyId,
      actingExternalIntegrationUser,
    );
  }
}
