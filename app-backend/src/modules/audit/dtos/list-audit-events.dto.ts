import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { AUDIT_SEVERITIES, AuditSeverity } from '../types/audit-severity';

export const DEFAULT_AUDIT_WINDOW_DAYS = 30;

export class ListAuditEventsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Restricts to one company. Must be a company the caller can access.',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Exact action, e.g. "rule.update"',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Exact entity name, e.g. "Rule"' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  @ApiPropertyOptional({ enum: AUDIT_SEVERITIES })
  @IsOptional()
  @IsIn(AUDIT_SEVERITIES)
  severity?: AuditSeverity;

  @ApiPropertyOptional({
    description:
      'Free-text match on the event message. Requires either another filter or a window of 7 days or less, since it is not backed by a text index.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: `ISO date, inclusive lower bound. Defaults to ${DEFAULT_AUDIT_WINDOW_DAYS} days ago: an unbounded scan over a company list degrades into a full sort.`,
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date, inclusive upper bound' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
