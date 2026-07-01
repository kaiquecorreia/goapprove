import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CompanyModule } from '../company/company.module';
import { PurchaseOrderController } from './purchase-order.controller';
import { PrismaPurchaseOrderRepository } from './repositories/prisma-purchase-order.repository';
import { PurchaseOrderRepository } from './repositories/purchase-order.repository';
import { PurchaseOrderService } from './services/purchase-order.service';
import { ReceivePurchaseOrderUseCase } from './use-cases/receive-purchase-order.use-case';

@Module({
  imports: [PrismaModule, CompanyModule],
  controllers: [PurchaseOrderController],
  providers: [
    PrismaService,
    PurchaseOrderService,
    ReceivePurchaseOrderUseCase,
    {
      provide: PurchaseOrderRepository,
      useClass: PrismaPurchaseOrderRepository,
    },
  ],
  exports: [PurchaseOrderRepository, PurchaseOrderService],
})
export class PurchaseOrderModule {}
