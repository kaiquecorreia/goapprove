import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AppJwtModule } from '../../shared/jwt/app-jwt.module';
import { CompanyModule } from '../company/company.module';
import { UserModule } from '../user/user.module';
import { PrismaRuleRepository } from './repositories/prisma-rule.repository';
import { RuleRepository } from './repositories/rule.repository';
import { RuleController } from './rule.controller';
import { RuleConditionEvaluatorService } from './services/rule-condition-evaluator.service';
import { RuleConflictResolverService } from './services/rule-conflict-resolver.service';
import { RuleEngineService } from './services/rule-engine.service';
import { RuleOperatorEvaluatorService } from './services/rule-operator-evaluator.service';
import { RuleService } from './services/rule.service';
import { CreateRuleUseCase } from './use-cases/create-rule.use-case';
import { DeleteRuleUseCase } from './use-cases/delete-rule.use-case';
import { GetRuleUseCase } from './use-cases/get-rule.use-case';
import { SetRuleStatusUseCase } from './use-cases/set-rule-status.use-case';
import { UpdateRuleUseCase } from './use-cases/update-rule.use-case';

@Module({
  imports: [PrismaModule, AppJwtModule, CompanyModule, UserModule],
  controllers: [RuleController],
  providers: [
    PrismaService,
    RuleService,
    RuleEngineService,
    RuleOperatorEvaluatorService,
    RuleConditionEvaluatorService,
    RuleConflictResolverService,
    CreateRuleUseCase,
    GetRuleUseCase,
    UpdateRuleUseCase,
    SetRuleStatusUseCase,
    DeleteRuleUseCase,
    { provide: RuleRepository, useClass: PrismaRuleRepository },
  ],
  exports: [RuleRepository, RuleEngineService, RuleService],
})
export class RuleModule {}
