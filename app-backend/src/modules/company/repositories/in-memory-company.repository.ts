import { Injectable } from '@nestjs/common';
import { Company } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { CreateCompanyDto } from '../dtos/create-company.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { CompanyRepository } from './company.repository';

@Injectable()
export class InMemoryCompanyRepository implements CompanyRepository {
  private readonly companies: Company[] = [];

  create(data: CreateCompanyDto): Promise<Company> {
    const existing = this.companies.find(
      (company) =>
        company.externalIntegrationCode === data.externalIntegrationCode,
    );

    if (existing) {
      throw new Error('Unique constraint violation');
    }

    const company: Company = {
      companyId: uuidv4(),
      externalIntegrationCode: data.externalIntegrationCode,
      name: data.name,
      environment: data.environment,
      cnpj: data.cnpj ?? null,
      status: data.status ?? true,
      externalIntegrationUrlBase: data.externalIntegrationUrlBase ?? null,
      notes: data.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.companies.push(company);

    return Promise.resolve(company);
  }

  findById(companyId: string): Promise<Company | null> {
    return Promise.resolve(
      this.companies.find((company) => company.companyId === companyId) ?? null,
    );
  }

  findAll(): Promise<Company[]> {
    return Promise.resolve(this.companies);
  }

  update(companyId: string, data: UpdateCompanyDto): Promise<Company | null> {
    const index = this.companies.findIndex(
      (company) => company.companyId === companyId,
    );

    if (index === -1) {
      return Promise.resolve(null);
    }

    const existing = this.companies[index];

    if (
      data.externalIntegrationCode &&
      data.externalIntegrationCode !== existing.externalIntegrationCode
    ) {
      const duplicated = this.companies.find(
        (company) =>
          company.companyId !== companyId &&
          company.externalIntegrationCode === data.externalIntegrationCode,
      );

      if (duplicated) {
        throw new Error('Unique constraint violation');
      }
    }

    const updated: Company = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    this.companies[index] = updated;

    return Promise.resolve(updated);
  }
}
