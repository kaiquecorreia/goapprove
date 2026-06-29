import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CryptoModule } from '../../shared/crypto/crypto.module';
import { CompanyModule } from '../company/company.module';
import { UserModule } from '../user/user.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { GetIntegrationConfigUseCase } from './use-cases/get-integration-config.use-case';

@Module({
  imports: [
    PrismaModule,
    CryptoModule,
    CompanyModule,
    UserModule,
    OnboardingModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GetIntegrationConfigUseCase],
})
export class AuthModule {}
