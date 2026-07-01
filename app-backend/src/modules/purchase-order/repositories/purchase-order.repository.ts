import { PurchaseOrder, PurchaseOrderLine } from '@prisma/client';

import { ReceivePurchaseOrderDto } from '../dtos/receive-purchase-order.dto';

export type PurchaseOrderWithLines = PurchaseOrder & {
  lines: PurchaseOrderLine[];
};

export abstract class PurchaseOrderRepository {
  abstract create(
    companyId: string,
    dto: ReceivePurchaseOrderDto,
  ): Promise<PurchaseOrderWithLines>;
}
