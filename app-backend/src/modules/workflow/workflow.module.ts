import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppJwtModule } from '../../shared/jwt/app-jwt.module';
import { CryptoModule } from '../../shared/crypto/crypto.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { UserModule } from '../user/user.module';
import { PrismaWorkflowRepository } from './repositories/prisma-workflow.repository';
import { WorkflowRepository } from './repositories/workflow.repository';
import { LnApiClient } from './services/ln-api-client';
import { LnSyncService } from './services/ln-sync.service';
import { WorkflowService } from './services/workflow.service';
import { GetPendingApprovalsUseCase } from './use-cases/get-pending-approvals.use-case';
import { GetWorkflowUseCase } from './use-cases/get-workflow.use-case';
import { RecordDecisionUseCase } from './use-cases/record-decision.use-case';
import { RetryLnSyncUseCase } from './use-cases/retry-ln-sync.use-case';
import { WorkflowController } from './workflow.controller';

@Module({
  imports: [
    PrismaModule,
    AppJwtModule,
    CryptoModule,
    OnboardingModule,
    UserModule,
    HttpModule,
  ],
  controllers: [WorkflowController],
  providers: [
    PrismaService,
    WorkflowService,
    LnSyncService,
    LnApiClient,
    GetPendingApprovalsUseCase,
    GetWorkflowUseCase,
    RecordDecisionUseCase,
    RetryLnSyncUseCase,
    { provide: WorkflowRepository, useClass: PrismaWorkflowRepository },
  ],
  exports: [WorkflowRepository, WorkflowService],
})
export class WorkflowModule {}
