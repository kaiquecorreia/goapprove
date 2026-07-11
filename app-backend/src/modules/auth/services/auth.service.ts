import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Provider } from '@prisma/client';

import { UserRepository } from '../../user/repositories/user.repository';
import { CompanyUserRepository } from '../../company/repositories/company-user.repository';
import { CompanyIntegrationRepository } from '../../onboarding/repositories/company-integration.repository';
import { CryptoService } from '../../../shared/crypto/crypto.service';

const NOT_FOUND_MESSAGE = 'User not found or not authorized';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyUserRepository: CompanyUserRepository,
    private readonly companyIntegrationRepository: CompanyIntegrationRepository,
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
  ) {}

  async issueSessionToken(externalIntegrationUser: string) {
    const user = await this.userRepository.findByExternalIntegrationUser(
      externalIntegrationUser,
    );

    if (!user || !user.active) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const companyUsers = await this.companyUserRepository.findByUserId(
      user.userId,
    );
    const defaultCompanyUser = companyUsers.find((cu) => cu.isDefault);

    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      role: user.role,
      email: user.email,
      companyId: defaultCompanyUser?.companyId,
    });

    return {
      accessToken,
      userId: user.userId,
      role: user.role,
      email: user.email,
      companyId: defaultCompanyUser?.companyId,
    };
  }

  async getIntegrationConfig(externalIntegrationUser: string) {
    const user = await this.userRepository.findByExternalIntegrationUser(
      externalIntegrationUser,
    );

    if (!user || !user.active) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const companyUsers = await this.companyUserRepository.findByUserId(
      user.userId,
    );
    const defaultCompanyUser = companyUsers.find((cu) => cu.isDefault);

    if (!defaultCompanyUser) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const integration =
      await this.companyIntegrationRepository.findByCompanyAndProvider(
        defaultCompanyUser.companyId,
        Provider.INFOR,
      );

    if (!integration || !integration.active) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    return {
      companyId: defaultCompanyUser.companyId,
      role: user.role,
      email: user.email,
      baseUrl: integration.baseUrl,
      clientId: integration.clientId,
      clientSecret: integration.clientSecret
        ? this.cryptoService.decrypt(integration.clientSecret)
        : undefined,
    };
  }
}
