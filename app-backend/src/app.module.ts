import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { CompanyModule } from './modules/company/company.module';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { InternalApiKeyGuard } from './shared/guards/internal-api-key.guard';

@Module({
  imports: [
    HealthModule,
    UserModule,
    CompanyModule,
    AuthModule,
    OnboardingModule,
    PurchaseOrderModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: InternalApiKeyGuard }],
})
export class AppModule {}
