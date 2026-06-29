import { Injectable } from '@nestjs/common';
import { CompanyIntegration, Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CompanyIntegrationRepository } from './company-integration.repository';

@Injectable()
export class PrismaCompanyIntegrationRepository
  implements CompanyIntegrationRepository
{
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    data: Prisma.CompanyIntegrationUncheckedCreateInput,
  ): Promise<CompanyIntegration> {
    return this.prismaService.getClient().companyIntegration.create({
      data,
    });
  }

  async findByCompanyAndProvider(
    companyId: string,
    provider: CompanyIntegration['provider'],
  ): Promise<CompanyIntegration | null> {
    return this.prismaService.getClient().companyIntegration.findUnique({
      where: { companyId_provider: { companyId, provider } },
    });
  }

  async update(
    integrationId: string,
    data: Prisma.CompanyIntegrationUncheckedUpdateInput,
  ): Promise<CompanyIntegration> {
    return this.prismaService.getClient().companyIntegration.update({
      where: { integrationId },
      data,
    });
  }
}
