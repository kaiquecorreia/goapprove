import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CompanyService } from '../services/company.service';

@Injectable()
export class GetCompanyUseCase {
  constructor(private readonly companyService: CompanyService) {}

  executeById(companyId: string, actingUser: AuthenticatedUser) {
    return this.companyService.findById(companyId, actingUser);
  }

  executeAll(actingUser: AuthenticatedUser) {
    return this.companyService.findAll(actingUser);
  }
}
