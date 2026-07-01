import { Injectable } from '@nestjs/common';

import { ReceivePurchaseOrderDto } from '../dtos/receive-purchase-order.dto';
import { PurchaseOrderService } from '../services/purchase-order.service';

@Injectable()
export class ReceivePurchaseOrderUseCase {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  execute(dto: ReceivePurchaseOrderDto) {
    return this.purchaseOrderService.receive(dto);
  }
}
