import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppJwtModule } from '../../shared/jwt/app-jwt.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CompanyModule } from '../company/company.module';
import { AuditController } from './audit.controller';
import { AuditContextInterceptor } from './context/audit-context.interceptor';
import { AuditContextMiddleware } from './context/audit-context.middleware';
import { AuditContextService } from './context/audit-context.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditRepository } from './repositories/audit.repository';
import { PrismaAuditRepository } from './repositories/prisma-audit.repository';
import { AuditQueryService } from './services/audit-query.service';
import { AuditWriter } from './services/audit-writer.service';
import { AuditService } from './services/audit.service';
import { GetEntityAuditTrailUseCase } from './use-cases/get-entity-audit-trail.use-case';
import { ListAuditEventsUseCase } from './use-cases/list-audit-events.use-case';

// Global so any service can inject AuditService without wiring an import,
// which is what keeps "audit something new" down to a single line.
@Global()
@Module({
  // Note: PrismaService is intentionally NOT re-declared here. Other modules
  // do re-declare it, and each of those ends up with its own pg.Pool.
  imports: [PrismaModule, AppJwtModule, CompanyModule],
  controllers: [AuditController],
  providers: [
    AuditContextService,
    AuditService,
    AuditWriter,
    AuditQueryService,
    ListAuditEventsUseCase,
    GetEntityAuditTrailUseCase,
    { provide: AuditRepository, useClass: PrismaAuditRepository },
    // Order matters: the context interceptor must resolve the actor before
    // the audit interceptor reads it. Declared here rather than in AppModule,
    // which is asserted to hold exactly one provider.
    { provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [AuditService, AuditContextService, AuditRepository],
})
export class AuditModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Express 5 / path-to-regexp 8 rejects a bare '*' wildcard.
    consumer
      .apply(AuditContextMiddleware)
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
