import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RuleConditionSourceType, RuleOperator } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class RuleConditionDto {
  @ApiProperty({
    enum: RuleConditionSourceType,
    description:
      'Where the field is resolved from: the PO header, PO lines (matches if ANY line satisfies the condition), the additionalFields JSON, or a manual portal field.',
  })
  @IsEnum(RuleConditionSourceType)
  sourceType!: RuleConditionSourceType;

  @ApiProperty({
    description:
      'Field name to evaluate, e.g. "totalAmount", "supplierCode", "costCenter", "category", or a key inside additionalFields.',
  })
  @IsString()
  @IsNotEmpty()
  field!: string;

  @ApiProperty({ enum: RuleOperator })
  @IsEnum(RuleOperator)
  operator!: RuleOperator;

  @ApiPropertyOptional({
    description:
      'Primary comparison value. Required for all operators except EXISTS/NOT_EXISTS.',
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    description: 'Upper bound, required only for BETWEEN.',
  })
  @IsOptional()
  @IsString()
  valueTo?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of values, required only for IN_LIST/NOT_IN_LIST.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  valueList?: string[];
}
