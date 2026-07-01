import { Injectable, NotFoundException } from '@nestjs/common';

import { CompanyRepository } from '../../company/repositories/company.repository';
import { ReceivePurchaseOrderDto } from '../dtos/receive-purchase-order.dto';
import { PurchaseOrderRepository } from '../repositories/purchase-order.repository';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async receive(dto: ReceivePurchaseOrderDto) {
    const company = await this.companyRepository.findFirst({
      externalIntegrationCode: dto.company.code,
    });

    if (!company) {
      throw new NotFoundException(
        `Company with external integration code ${dto.company.code} not found`,
      );
    }

    return this.purchaseOrderRepository.create(company.companyId, dto);
  }
}
