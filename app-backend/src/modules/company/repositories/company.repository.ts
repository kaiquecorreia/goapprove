import { Company } from '@prisma/client';

import { CreateCompanyDto } from '../dtos/create-company.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';

export abstract class CompanyRepository {
  abstract create(data: CreateCompanyDto): Promise<Company>;
  abstract findById(companyId: string): Promise<Company | null>;
  abstract findAll(): Promise<Company[]>;
  abstract update(
    companyId: string,
    data: UpdateCompanyDto,
  ): Promise<Company | null>;
}
