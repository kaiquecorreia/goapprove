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
  abstract findLatestByOrderNumber(
    companyId: string,
    orderNumber: string,
  ): Promise<PurchaseOrderWithLines | null>;
  /** Overwrites header and lines with the new event and resets status to PENDING. */
  abstract update(
    purchaseOrderId: string,
    dto: ReceivePurchaseOrderDto,
  ): Promise<PurchaseOrderWithLines>;
}
