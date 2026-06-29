import { Injectable } from '@nestjs/common';
import { CompanyUser } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CompanyUserRepository } from './company-user.repository';

@Injectable()
export class PrismaCompanyUserRepository implements CompanyUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: {
    companyId: string;
    userId: string;
    isDefault: boolean;
  }): Promise<CompanyUser> {
    return this.prismaService.getClient().companyUser.create({
      data,
    });
  }

  async findByCompanyId(companyId: string): Promise<CompanyUser[]> {
    return this.prismaService.getClient().companyUser.findMany({
      where: { companyId },
    });
  }

  async findByUserId(userId: string): Promise<CompanyUser[]> {
    return this.prismaService.getClient().companyUser.findMany({
      where: { userId },
    });
  }
}
