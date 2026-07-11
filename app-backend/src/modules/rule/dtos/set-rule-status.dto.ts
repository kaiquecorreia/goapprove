import { ApiProperty } from '@nestjs/swagger';
import { RuleStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SetRuleStatusDto {
  @ApiProperty({ enum: RuleStatus })
  @IsEnum(RuleStatus)
  status!: RuleStatus;
}
