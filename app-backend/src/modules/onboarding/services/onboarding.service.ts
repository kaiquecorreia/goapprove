import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Environment, UserRole } from '@prisma/client';

import { CreateCompanyUseCase } from '../../company/use-cases/create-company.use-case';
import { CompanyRepository } from '../../company/repositories/company.repository';
import { CompanyUserRepository } from '../../company/repositories/company-user.repository';
import { CreateUserUseCase } from '../../user/use-cases/create-user.use-case';
import { UserRepository } from '../../user/repositories/user.repository';
import { CryptoService } from '../../../shared/crypto/crypto.service';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { CreateOnboardingDto } from '../dtos/create-onboarding.dto';
import { UpdateIntegrationDto } from '../dtos/update-integration.dto';
import { CompanyIntegrationRepository } from '../repositories/company-integration.repository';

const FORBIDDEN_MESSAGE = 'User not found or not authorized';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly companyUserRepository: CompanyUserRepository,
    private readonly companyIntegrationRepository: CompanyIntegrationRepository,
    private readonly userRepository: UserRepository,
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly cryptoService: CryptoService,
    private readonly transactionService: TransactionService,
  ) {}

  private async assertOwnerOfCompany(
    companyId: string,
    actingExternalIntegrationUser: string,
  ) {
    const user = await this.userRepository.findByExternalIntegrationUser(
      actingExternalIntegrationUser,
    );

    if (!user || !user.active || user.role !== UserRole.OWNER) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }

    const companyUsers = await this.companyUserRepository.findByUserId(
      user.userId,
    );

    if (!companyUsers.some((cu) => cu.companyId === companyId)) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }
  }

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
        role: UserRole.OWNER,
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

  async getCompanyIntegration(
    companyId: string,
    actingExternalIntegrationUser: string,
  ) {
    await this.assertOwnerOfCompany(companyId, actingExternalIntegrationUser);

    const integration =
      await this.companyIntegrationRepository.findByCompanyAndProvider(
        companyId,
        'INFOR',
      );

    if (!integration) {
      throw new NotFoundException('Integration not found for this company');
    }

    return {
      provider: integration.provider,
      baseUrl: integration.baseUrl,
      clientId: integration.clientId,
      hasSecret: !!integration.clientSecret,
    };
  }

  async updateCompanyIntegration(companyId: string, dto: UpdateIntegrationDto) {
    await this.assertOwnerOfCompany(companyId, dto.actingExternalIntegrationUser);

    const integration =
      await this.companyIntegrationRepository.findByCompanyAndProvider(
        companyId,
        'INFOR',
      );

    if (!integration) {
      throw new NotFoundException('Integration not found for this company');
    }

    const updated = await this.companyIntegrationRepository.update(
      integration.integrationId,
      {
        baseUrl: dto.baseUrl,
        clientId: dto.clientId,
        clientSecret: dto.clientSecret
          ? this.cryptoService.encrypt(dto.clientSecret)
          : undefined,
      },
    );

    return {
      provider: updated.provider,
      baseUrl: updated.baseUrl,
      clientId: updated.clientId,
      hasSecret: !!updated.clientSecret,
    };
  }
}
