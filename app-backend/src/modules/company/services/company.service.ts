import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateCompanyDto } from '../dtos/create-company.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { CompanyRepository } from '../repositories/company.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async create(data: CreateCompanyDto) {
    return this.prismaService.runInTransaction(async () => {
      try {
        return await this.companyRepository.create(data);
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException(
            'A company with this external integration code already exists',
          );
        }

        throw error;
      }
    });
  }

  async findById(companyId: string) {
    const company = await this.companyRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException(`Company with id ${companyId} not found`);
    }

    return company;
  }

  async findAll() {
    return this.companyRepository.findAll();
  }

  async delete(companyId: string) {
    return this.prismaService.runInTransaction(async () => {
      const company = await this.companyRepository.findById(companyId);

      if (!company) {
        throw new NotFoundException(`Company with id ${companyId} not found`);
      }

      // In the future, this will handle cascade deletion of related entities
      // For now, we'll implement a soft delete by updating the status
      return await this.companyRepository.update(companyId, { status: false });
    });
  }

  async update(companyId: string, data: UpdateCompanyDto) {
    return this.prismaService.runInTransaction(async () => {
      try {
        const company = await this.companyRepository.update(companyId, data);

        if (!company) {
          throw new NotFoundException(`Company with id ${companyId} not found`);
        }

        return company;
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException(
            'A company with this external integration code already exists',
          );
        }

        throw error;
      }
    });
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
