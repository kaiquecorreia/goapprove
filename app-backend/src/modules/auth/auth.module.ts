import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CryptoModule } from '../../shared/crypto/crypto.module';
import { PasswordModule } from '../../shared/password/password.module';
import { AppJwtModule } from '../../shared/jwt/app-jwt.module';
import { CompanyModule } from '../company/company.module';
import { UserModule } from '../user/user.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthCallbackUseCase } from './use-cases/auth-callback.use-case';
import { GetIntegrationConfigUseCase } from './use-cases/get-integration-config.use-case';
import { LoginUseCase } from './use-cases/login.use-case';

@Module({
  imports: [
    PrismaModule,
    CryptoModule,
    PasswordModule,
    AppJwtModule,
    CompanyModule,
    UserModule,
    OnboardingModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GetIntegrationConfigUseCase,
    AuthCallbackUseCase,
    LoginUseCase,
  ],
})
export class AuthModule {}
