import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFiltersDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Restricts the metrics to a single company. Validated against the caller’s accessible companies; omit to aggregate across all of them',
  })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    description:
      'ISO date, inclusive lower bound on the PO ERP creation date. Defaults to the start of the month 5 months ago',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description:
      'ISO date, inclusive upper bound on the PO ERP creation date. Defaults to now',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class MonthlyTrendDto extends DashboardFiltersDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 24,
    default: 6,
    description:
      'Number of months to chart. Ignored when dateFrom/dateTo are both provided',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number = 6;
}

export class CompanyDistributionDto extends DashboardFiltersDto {
  @ApiPropertyOptional({
    minimum: 2,
    maximum: 10,
    default: 4,
    description:
      'Maximum number of slices. The largest (limit - 1) companies are returned individually and the remainder is aggregated into an "Outras" entry',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(10)
  limit?: number = 4;
}

export class RecentActivityDto extends DashboardFiltersDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 6;
}
