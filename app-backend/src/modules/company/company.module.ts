import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { CompanyController } from './company.controller';
import { PrismaCompanyRepository } from './repositories/prisma-company.repository';
import { CompanyRepository } from './repositories/company.repository';
import { CompanyService } from './services/company.service';
import { CreateCompanyUseCase } from './use-cases/create-company.use-case';
import { GetCompanyUseCase } from './use-cases/get-company.use-case';
import { UpdateCompanyUseCase } from './use-cases/update-company.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CreateCompanyUseCase,
    GetCompanyUseCase,
    UpdateCompanyUseCase,
    { provide: CompanyRepository, useClass: PrismaCompanyRepository },
  ],
})
export class CompanyModule {}
