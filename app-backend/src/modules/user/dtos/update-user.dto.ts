import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateUserDto } from './create-user.dto';

// Password changes go exclusively through PATCH /user/:id/password
// (SetPasswordDto) — never accept it on the general update endpoint.
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
