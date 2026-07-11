import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RuleConflictStrategy, RuleStatus } from '@prisma/client';

import { RuleConditionDto } from './rule-condition.dto';
import { RuleLevelDto } from './rule-level.dto';

export class CreateRuleDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    format: 'uuid',
    description:
      'Company this rule applies to. Not a condition — scopes which POs this rule is even considered for.',
  })
  @IsUUID('4')
  companyId!: string;

  @ApiProperty({
    minimum: 1,
    description: 'Evaluation priority. Lower number = higher priority.',
  })
  @IsInt()
  @Min(1)
  priority!: number;

  @ApiProperty()
  @IsISO8601()
  validFrom!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @ApiPropertyOptional({ enum: RuleStatus })
  @IsOptional()
  @IsEnum(RuleStatus)
  status?: RuleStatus;

  @ApiProperty({ enum: RuleConflictStrategy })
  @IsEnum(RuleConflictStrategy)
  conflictStrategy!: RuleConflictStrategy;

  @ApiProperty({ type: [RuleConditionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions!: RuleConditionDto[];

  @ApiProperty({ type: [RuleLevelDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RuleLevelDto)
  levels!: RuleLevelDto[];
}
