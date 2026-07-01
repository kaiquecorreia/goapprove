import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ReceivePurchaseOrderDto } from '../dtos/receive-purchase-order.dto';
import {
  PurchaseOrderRepository,
  PurchaseOrderWithLines,
} from './purchase-order.repository';

@Injectable()
export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    companyId: string,
    dto: ReceivePurchaseOrderDto,
  ): Promise<PurchaseOrderWithLines> {
    const { purchaseOrder: po, lines } = dto;

    return this.prismaService.getClient().purchaseOrder.create({
      data: {
        companyId,
        sourceSystem: dto.sourceSystem,
        eventType: dto.eventType,
        schemaVersion: dto.schemaVersion,
        sentAt: new Date(dto.sentAt),
        orderNumber: po.orderNumber,
        revision: po.revision,
        orderType: po.orderType,
        statusLn: po.statusLn,
        erpCreatedAt: new Date(po.createdAt),
        buyerCode: po.buyerCode,
        buyerName: po.buyerName,
        requesterCode: po.requesterCode,
        requesterName: po.requesterName,
        supplierCode: po.supplierCode,
        supplierName: po.supplierName,
        currency: po.currency,
        totalAmount: po.totalAmount,
        paymentTerms: po.paymentTerms,
        costCenter: po.costCenter,
        department: po.department,
        projectCode: po.projectCode,
        warehouse: po.warehouse,
        additionalFields:
          (po.additionalFields as Prisma.InputJsonObject) ?? undefined,
        lines: {
          create: lines.map((line) => ({
            lineNumber: line.lineNumber,
            itemCode: line.itemCode,
            itemDescription: line.itemDescription,
            quantity: line.quantity,
            unitOfMeasure: line.unitOfMeasure,
            unitPrice: line.unitPrice,
            lineAmount: line.lineAmount,
            costCenter: line.costCenter,
            category: line.category,
            deliveryDate: line.deliveryDate
              ? new Date(line.deliveryDate)
              : null,
          })),
        },
      },
      include: { lines: true },
    });
  }
}
