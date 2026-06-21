import { Module } from '@nestjs/common';

import { CompanyModule } from './modules/company/company.module';
import { HealthModule } from './modules/health/health.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [HealthModule, UserModule, CompanyModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
