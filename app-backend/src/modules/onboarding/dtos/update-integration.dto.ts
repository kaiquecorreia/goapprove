import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateIntegrationDto {
  @ApiProperty({ description: 'externalIntegrationUser of the requester' })
  @IsString()
  @IsNotEmpty()
  actingExternalIntegrationUser!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  baseUrl?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clientSecret?: string;

  @ApiPropertyOptional({
    description: 'ION API base URL with tenant (iu + ti from the .ionapi)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ionApiUrl?: string;

  @ApiPropertyOptional({
    maxLength: 255,
    description: 'Backend Service client id (ci)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceClientId?: string;

  @ApiPropertyOptional({ description: 'Backend Service client secret (cs)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  serviceClientSecret?: string;

  @ApiPropertyOptional({ description: 'Service account access key (saak)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  serviceAccountKey?: string;

  @ApiPropertyOptional({ description: 'Service account secret key (sask)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  serviceAccountSecret?: string;
}
