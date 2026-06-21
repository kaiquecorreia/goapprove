import { Injectable } from '@nestjs/common';

import { CreateCompanyDto } from '../dtos/create-company.dto';
import { CompanyService } from '../services/company.service';

@Injectable()
export class CreateCompanyUseCase {
  constructor(private readonly companyService: CompanyService) {}

  execute(data: CreateCompanyDto) {
    return this.companyService.create(data);
  }
}
