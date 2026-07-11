import { ApiProperty } from '@nestjs/swagger';
import { ApprovalMode } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsUUID,
  Min,
} from 'class-validator';

export class RuleLevelDto {
  @ApiProperty({
    minimum: 1,
    description: 'Sequential level number (1, 2, 3...).',
  })
  @IsInt()
  @Min(1)
  levelNumber!: number;

  @ApiProperty({ enum: ApprovalMode })
  @IsEnum(ApprovalMode)
  mode!: ApprovalMode;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'Real User.userId references, in approval order (used as SEQUENTIAL order).',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  approverUserIds!: string[];
}
