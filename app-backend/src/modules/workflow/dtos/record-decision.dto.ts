import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecisionType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class RecordDecisionDto {
  @ApiProperty({ enum: DecisionType })
  @IsEnum(DecisionType)
  decision!: DecisionType;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Disambiguates which original approver you are acting on behalf of, when substituting for more than one pending approver on the active level.',
  })
  @IsOptional()
  @IsUUID('4')
  onBehalfOfUserId?: string;
}
