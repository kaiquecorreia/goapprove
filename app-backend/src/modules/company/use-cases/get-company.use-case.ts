import { Injectable } from '@nestjs/common';

import { CompanyService } from '../services/company.service';

@Injectable()
export class GetCompanyUseCase {
  constructor(private readonly companyService: CompanyService) {}

  executeById(companyId: string) {
    return this.companyService.findById(companyId);
  }

  executeAll() {
    return this.companyService.findAll();
  }
}
