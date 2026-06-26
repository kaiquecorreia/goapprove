import { Injectable } from '@nestjs/common';

import { CreateOnboardingDto } from '../dtos/create-onboarding.dto';
import { OnboardingService } from '../services/onboarding.service';

@Injectable()
export class CreateOnboardingUseCase {
  constructor(private readonly onboardingService: OnboardingService) {}

  execute(data: CreateOnboardingDto) {
    return this.onboardingService.createCompanyOnboarding(data);
  }
}
