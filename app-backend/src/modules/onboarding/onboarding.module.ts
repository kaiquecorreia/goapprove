import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CryptoModule } from '../../shared/crypto/crypto.module';
import { CompanyModule } from '../company/company.module';
import { UserModule } from '../user/user.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './services/onboarding.service';
import { CreateOnboardingUseCase } from './use-cases/create-onboarding.use-case';
import { GetCompanyIntegrationUseCase } from './use-cases/get-company-integration.use-case';
import { UpdateCompanyIntegrationUseCase } from './use-cases/update-company-integration.use-case';
import { CompanyIntegrationRepository } from './repositories/company-integration.repository';
import { PrismaCompanyIntegrationRepository } from './repositories/prisma-company-integration.repository';

@Module({
  imports: [PrismaModule, CryptoModule, CompanyModule, UserModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    CreateOnboardingUseCase,
    GetCompanyIntegrationUseCase,
    UpdateCompanyIntegrationUseCase,
    {
      provide: CompanyIntegrationRepository,
      useClass: PrismaCompanyIntegrationRepository,
    },
  ],
  exports: [CompanyIntegrationRepository],
})
export class OnboardingModule {}
