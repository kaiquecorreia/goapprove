import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyRefDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;
}

export class PurchaseOrderDataDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  orderNumber!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  revision!: number;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  orderType!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  statusLn!: string;

  @ApiProperty()
  @IsISO8601()
  createdAt!: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  buyerCode?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  buyerName?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  requesterCode?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  requesterName?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierCode?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  supplierName?: string;

  @ApiPropertyOptional({ maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  totalAmount!: number;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  costCenter?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  department?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  projectCode?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  warehouse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  additionalFields?: Record<string, unknown>;
}

export class PurchaseOrderLineDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  lineNumber!: number;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  itemCode!: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  itemDescription!: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  quantity!: number;

  @ApiProperty({ maxLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  unitOfMeasure!: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  lineAmount!: number;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  costCenter?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sourceSystem!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType!: string;

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  schemaVersion!: string;

  @ApiProperty()
  @IsISO8601()
  sentAt!: string;

  @ApiProperty({ type: CompanyRefDto })
  @ValidateNested()
  @Type(() => CompanyRefDto)
  company!: CompanyRefDto;

  @ApiProperty({ type: PurchaseOrderDataDto })
  @ValidateNested()
  @Type(() => PurchaseOrderDataDto)
  purchaseOrder!: PurchaseOrderDataDto;

  @ApiProperty({ type: [PurchaseOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
}
