import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Provider } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IntegrationCredentialsDto {
  @ApiProperty({ enum: Provider })
  @IsEnum(Provider)
  provider!: Provider;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  baseUrl!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientSecret?: string;
}

export class CreateOnboardingDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  companyName!: string;

  @ApiPropertyOptional({ minLength: 14, maxLength: 14 })
  @IsOptional()
  @IsString()
  @Length(14, 14)
  cnpj?: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  externalIntegrationCode!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  adminName!: string;

  @ApiProperty({ maxLength: 150 })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  adminEmail!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  adminExternalIntegrationUser!: string;

  @ApiProperty({ type: IntegrationCredentialsDto })
  @ValidateNested()
  @Type(() => IntegrationCredentialsDto)
  integration!: IntegrationCredentialsDto;
}
