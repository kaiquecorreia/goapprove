import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthCallbackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  externalIntegrationUser!: string;
}
