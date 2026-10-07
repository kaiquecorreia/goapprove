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
    return this.prismaService.getClient().purchaseOrder.create({
      data: {
        companyId,
        ...this.toHeaderData(dto),
        lines: { create: this.toLinesData(dto) },
      },
      include: { lines: true },
    });
  }

  // Latest, not unique: databases may still hold duplicates received before
  // re-sent orders started updating the existing one.
  async findLatestByOrderNumber(
    companyId: string,
    orderNumber: string,
  ): Promise<PurchaseOrderWithLines | null> {
    return this.prismaService.getClient().purchaseOrder.findFirst({
      where: { companyId, orderNumber },
      orderBy: { createdAt: 'desc' },
      include: { lines: { orderBy: { lineNumber: 'asc' } } },
    });
  }

  async update(
    purchaseOrderId: string,
    dto: ReceivePurchaseOrderDto,
  ): Promise<PurchaseOrderWithLines> {
    return this.prismaService.getClient().purchaseOrder.update({
      where: { purchaseOrderId },
      data: {
        ...this.toHeaderData(dto),
        status: 'PENDING',
        lines: { deleteMany: {}, create: this.toLinesData(dto) },
      },
      include: { lines: true },
    });
  }

  // Optional fields map to explicit nulls: on update, undefined would keep the
  // previous event's value instead of reflecting the new one.
  private toHeaderData(dto: ReceivePurchaseOrderDto) {
    const { purchaseOrder: po } = dto;

    return {
      sourceSystem: dto.sourceSystem,
      eventType: dto.eventType,
      schemaVersion: dto.schemaVersion,
      requestId: dto.requestId,
      batchId: dto.batchId,
      sentAt: new Date(dto.sentAt),
      orderNumber: po.orderNumber,
      revision: po.revision,
      orderType: po.orderType,
      statusLn: po.statusLn,
      erpCreatedAt: new Date(po.createdAt),
      buyerCode: po.buyerCode ?? null,
      buyerName: po.buyerName ?? null,
      requesterCode: po.requesterCode ?? null,
      requesterName: po.requesterName ?? null,
      supplierCode: po.supplierCode ?? null,
      supplierName: po.supplierName ?? null,
      currency: po.currency ?? null,
      totalAmount: po.totalAmount,
      paymentTerms: po.paymentTerms ?? null,
      costCenter: po.costCenter ?? null,
      department: po.department ?? null,
      projectCode: po.projectCode ?? null,
      warehouse: po.warehouse ?? null,
      additionalFields:
        (po.additionalFields as Prisma.InputJsonObject) ?? Prisma.DbNull,
    };
  }

  private toLinesData(dto: ReceivePurchaseOrderDto) {
    return dto.lines.map((line) => ({
      lineNumber: line.lineNumber,
      itemCode: line.itemCode,
      itemDescription: line.itemDescription,
      quantity: line.quantity,
      unitOfMeasure: line.unitOfMeasure,
      unitPrice: line.unitPrice,
      lineAmount: line.lineAmount,
      costCenter: line.costCenter,
      category: line.category,
      deliveryDate: line.deliveryDate ? new Date(line.deliveryDate) : null,
    }));
  }
}
