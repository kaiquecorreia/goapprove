import { CompanyIntegration, Prisma } from '@prisma/client';

export abstract class CompanyIntegrationRepository {
  abstract create(
    data: Prisma.CompanyIntegrationUncheckedCreateInput,
  ): Promise<CompanyIntegration>;
  abstract findByCompanyAndProvider(
    companyId: string,
    provider: CompanyIntegration['provider'],
  ): Promise<CompanyIntegration | null>;
  abstract update(
    integrationId: string,
    data: Prisma.CompanyIntegrationUncheckedUpdateInput,
  ): Promise<CompanyIntegration>;
}
