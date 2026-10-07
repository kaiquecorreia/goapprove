import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyIntegration, Environment, UserRole } from '@prisma/client';

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

  // ADMINISTRATOR manages integrations of every company, not only the ones
  // it's linked to — same unrestricted scope it has everywhere else.
  private async assertAdministrator(actingExternalIntegrationUser: string) {
    const user = await this.userRepository.findByExternalIntegrationUser(
      actingExternalIntegrationUser,
    );

    if (!user || !user.active || user.role !== UserRole.ADMINISTRATOR) {
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

    const clientSecret = this.encryptIfPresent(dto.integration.clientSecret);

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
        password: dto.adminPassword,
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
        ionApiUrl: dto.integration.ionApiUrl,
        serviceClientId: dto.integration.serviceClientId,
        serviceClientSecret: this.encryptIfPresent(
          dto.integration.serviceClientSecret,
        ),
        serviceAccountKey: dto.integration.serviceAccountKey,
        serviceAccountSecret: this.encryptIfPresent(
          dto.integration.serviceAccountSecret,
        ),
        active: true,
      });

      return { company, user, integration };
    });
  }

  async getCompanyIntegration(
    companyId: string,
    actingExternalIntegrationUser: string,
  ) {
    await this.assertAdministrator(actingExternalIntegrationUser);

    const integration =
      await this.companyIntegrationRepository.findByCompanyAndProvider(
        companyId,
        'INFOR',
      );

    if (!integration) {
      throw new NotFoundException('Integration not found for this company');
    }

    return this.toIntegrationResponse(integration);
  }

  async updateCompanyIntegration(companyId: string, dto: UpdateIntegrationDto) {
    await this.assertAdministrator(dto.actingExternalIntegrationUser);

    const company = await this.companyRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException(`Company with id ${companyId} not found`);
    }

    const data = {
      baseUrl: dto.baseUrl,
      clientId: dto.clientId,
      clientSecret: this.encryptIfPresent(dto.clientSecret),
      ionApiUrl: dto.ionApiUrl,
      serviceClientId: dto.serviceClientId,
      serviceClientSecret: this.encryptIfPresent(dto.serviceClientSecret),
      serviceAccountKey: dto.serviceAccountKey,
      serviceAccountSecret: this.encryptIfPresent(dto.serviceAccountSecret),
    };

    const integration =
      await this.companyIntegrationRepository.findByCompanyAndProvider(
        companyId,
        'INFOR',
      );

    if (integration) {
      return this.toIntegrationResponse(
        await this.companyIntegrationRepository.update(
          integration.integrationId,
          data,
        ),
      );
    }

    // Companies created outside onboarding have no integration yet: the first
    // save creates it.
    if (!dto.baseUrl) {
      throw new BadRequestException(
        'baseUrl is required to create the integration',
      );
    }

    return this.toIntegrationResponse(
      await this.companyIntegrationRepository.create({
        ...data,
        baseUrl: dto.baseUrl,
        companyId,
        provider: 'INFOR',
        authType: 'oauth2',
        active: true,
      }),
    );
  }

  private encryptIfPresent(value?: string): string | undefined {
    return value ? this.cryptoService.encrypt(value) : undefined;
  }

  // Secrets never leave the backend; the UI only needs to know they're set.
  private toIntegrationResponse(integration: CompanyIntegration) {
    return {
      provider: integration.provider,
      baseUrl: integration.baseUrl,
      clientId: integration.clientId,
      hasSecret: !!integration.clientSecret,
      ionApiUrl: integration.ionApiUrl,
      serviceClientId: integration.serviceClientId,
      hasServiceClientSecret: !!integration.serviceClientSecret,
      serviceAccountKey: integration.serviceAccountKey,
      hasServiceAccountSecret: !!integration.serviceAccountSecret,
    };
  }
}
