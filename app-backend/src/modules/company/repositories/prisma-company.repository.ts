import { Injectable } from '@nestjs/common';
import { Company, Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { CompanyRepository } from './company.repository';

@Injectable()
export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreateCompanyDto): Promise<Company> {
    return this.prismaService.getClient().company.create({
      data,
    });
  }

  async findById(companyId: string): Promise<Company | null> {
    return this.prismaService.getClient().company.findUnique({
      where: { companyId },
    });
  }

  async findFirst(criteria: Prisma.CompanyWhereInput): Promise<Company | null> {
    return this.prismaService.getClient().company.findFirst({
      where: criteria,
    });
  }

  async findAll(): Promise<Company[]> {
    return this.prismaService.getClient().company.findMany();
  }

  async update(
    companyId: string,
    data: UpdateCompanyDto,
  ): Promise<Company | null> {
    return this.prismaService.getClient().company.update({
      where: { companyId },
      data,
    });
  }
}
