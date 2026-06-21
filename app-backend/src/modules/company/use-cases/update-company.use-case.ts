import { Injectable } from '@nestjs/common';

import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { CompanyService } from '../services/company.service';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(private readonly companyService: CompanyService) {}

  execute(companyId: string, data: UpdateCompanyDto) {
    return this.companyService.update(companyId, data);
  }
}
