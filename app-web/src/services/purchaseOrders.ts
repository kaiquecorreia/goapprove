import { mockPurchaseOrders } from '@/lib/mock';
import type { PurchaseOrder } from '@/lib/mock/types';

export function getPurchaseOrders(): PurchaseOrder[] {
  return mockPurchaseOrders;
}

export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  return mockPurchaseOrders.find((order) => order.id === id);
}
