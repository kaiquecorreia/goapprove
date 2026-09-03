import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { CompanyService } from '../services/company.service';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(private readonly companyService: CompanyService) {}

  execute(
    companyId: string,
    data: UpdateCompanyDto,
    actingUser: AuthenticatedUser,
  ) {
    return this.companyService.update(companyId, data, actingUser);
  }
}
