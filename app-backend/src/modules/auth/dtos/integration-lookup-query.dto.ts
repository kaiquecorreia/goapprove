import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class IntegrationLookupQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  externalIntegrationUser!: string;
}
