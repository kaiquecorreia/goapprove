import { Module } from '@nestjs/common';

import { CompanyModule } from './modules/company/company.module';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [HealthModule, UserModule, CompanyModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
