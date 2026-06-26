import { ConflictException, Injectable } from '@nestjs/common';
import { Environment, UserRole } from '@prisma/client';

import { CreateCompanyUseCase } from '../../company/use-cases/create-company.use-case';
import { CompanyRepository } from '../../company/repositories/company.repository';
import { CompanyUserRepository } from '../../company/repositories/company-user.repository';
import { CreateUserUseCase } from '../../user/use-cases/create-user.use-case';
import { CryptoService } from '../../../shared/crypto/crypto.service';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { CreateOnboardingDto } from '../dtos/create-onboarding.dto';
import { CompanyIntegrationRepository } from '../repositories/company-integration.repository';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly companyUserRepository: CompanyUserRepository,
    private readonly companyIntegrationRepository: CompanyIntegrationRepository,
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly cryptoService: CryptoService,
    private readonly transactionService: TransactionService,
  ) {}

  async createCompanyOnboarding(dto: CreateOnboardingDto) {
    const existing = await this.companyRepository.findFirst({
      OR: [
        ...(dto.cnpj ? [{ cnpj: dto.cnpj }] : []),
        { externalIntegrationCode: dto.externalIntegrationCode },
      ],
    });

    if (existing) {
      throw new ConflictException(
        'A company with this cnpj or external integration code already exists',
      );
    }

    const clientSecret = dto.integration.clientSecret
      ? this.cryptoService.encrypt(dto.integration.clientSecret)
      : undefined;

    return this.transactionService.run(async () => {
      const company = await this.createCompanyUseCase.execute({
        name: dto.companyName,
        externalIntegrationCode: dto.externalIntegrationCode,
        cnpj: dto.cnpj,
        environment: Environment.DEVELOPMENT,
      });

      const user = await this.createUserUseCase.execute({
        name: dto.adminName,
        email: dto.adminEmail,
        externalIntegrationUser: dto.adminExternalIntegrationUser,
        role: UserRole.ADMINISTRATOR,
      });

      await this.companyUserRepository.create({
        companyId: company.companyId,
        userId: user.userId,
        isDefault: true,
      });

      const integration = await this.companyIntegrationRepository.create({
        companyId: company.companyId,
        provider: dto.integration.provider,
        authType: 'oauth2',
        baseUrl: dto.integration.baseUrl,
        clientId: dto.integration.clientId,
        clientSecret,
        active: true,
      });

      return { company, user, integration };
    });
  }
}
