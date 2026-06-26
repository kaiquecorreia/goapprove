import { CompanyUser } from '@prisma/client';

export abstract class CompanyUserRepository {
  abstract create(data: {
    companyId: string;
    userId: string;
    isDefault: boolean;
  }): Promise<CompanyUser>;
  abstract findByCompanyId(companyId: string): Promise<CompanyUser[]>;
}
