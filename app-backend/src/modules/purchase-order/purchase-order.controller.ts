import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ReceivePurchaseOrderDto } from './dtos/receive-purchase-order.dto';
import { ReceivePurchaseOrderUseCase } from './use-cases/receive-purchase-order.use-case';

@ApiTags('Purchase Order')
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(
    private readonly receivePurchaseOrderUseCase: ReceivePurchaseOrderUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Receive a purchase order event from an ERP (e.g. INFOR_LN)',
  })
  @ApiBody({ type: ReceivePurchaseOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Purchase order received and stored',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found for the given external integration code',
  })
  create(@Body() dto: ReceivePurchaseOrderDto) {
    return this.receivePurchaseOrderUseCase.execute(dto);
  }
}
