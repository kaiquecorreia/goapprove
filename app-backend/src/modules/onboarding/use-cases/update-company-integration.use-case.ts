import { Injectable } from '@nestjs/common';

import { UpdateIntegrationDto } from '../dtos/update-integration.dto';
import { OnboardingService } from '../services/onboarding.service';

@Injectable()
export class UpdateCompanyIntegrationUseCase {
  constructor(private readonly onboardingService: OnboardingService) {}

  execute(companyId: string, data: UpdateIntegrationDto) {
    return this.onboardingService.updateCompanyIntegration(companyId, data);
  }
}
