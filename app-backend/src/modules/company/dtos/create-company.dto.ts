import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { Environment } from '@prisma/client';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  externalIntegrationCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsEnum(Environment)
  environment!: Environment;

  @IsOptional()
  @IsString()
  @Length(14, 14)
  cnpj?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsString()
  externalIntegrationUrlBase?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
