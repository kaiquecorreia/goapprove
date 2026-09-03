import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CompanyUserRepository } from '../repositories/company-user.repository';

const FORBIDDEN_MESSAGE = 'You do not have access to this resource';

@Injectable()
export class CompanyAccessService {
  constructor(private readonly companyUserRepository: CompanyUserRepository) {}

  async getAccessibleCompanyIds(
    actingUser: AuthenticatedUser,
  ): Promise<string[] | null> {
    if (actingUser.role === UserRole.ADMINISTRATOR) {
      return null;
    }

    const companyUsers = await this.companyUserRepository.findByUserId(
      actingUser.userId,
    );

    return companyUsers.map((companyUser) => companyUser.companyId);
  }

  async assertCompanyAccess(
    actingUser: AuthenticatedUser,
    targetCompanyIds: string[],
    mode: 'any' | 'all' = 'any',
  ): Promise<void> {
    const accessibleCompanyIds = await this.getAccessibleCompanyIds(actingUser);

    if (accessibleCompanyIds === null) {
      return;
    }

    const hasAccess =
      mode === 'all'
        ? targetCompanyIds.length > 0 &&
          targetCompanyIds.every((id) => accessibleCompanyIds.includes(id))
        : targetCompanyIds.some((id) => accessibleCompanyIds.includes(id));

    if (!hasAccess) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }
  }
}
