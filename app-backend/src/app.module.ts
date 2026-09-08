import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuditModule } from './modules/audit/audit.module';
import { CompanyModule } from './modules/company/company.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { RuleModule } from './modules/rule/rule.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { InternalApiKeyGuard } from './shared/guards/internal-api-key.guard';

@Module({
  imports: [
    HealthModule,
    UserModule,
    CompanyModule,
    AuthModule,
    OnboardingModule,
    RuleModule,
    WorkflowModule,
    PurchaseOrderModule,
    DashboardModule,
    AuditModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: InternalApiKeyGuard }],
})
export class AppModule {}
