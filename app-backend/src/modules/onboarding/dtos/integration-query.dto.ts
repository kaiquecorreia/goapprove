import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class IntegrationQueryDto {
  @ApiProperty({ description: 'externalIntegrationUser of the requester' })
  @IsString()
  @IsNotEmpty()
  actingExternalIntegrationUser!: string;
}
