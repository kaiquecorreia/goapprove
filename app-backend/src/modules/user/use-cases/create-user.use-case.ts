import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserService } from '../services/user.service';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userService: UserService) {}

  // Unauthenticated bootstrap primitive — used only by the public onboarding flow,
  // which creates the very first OWNER of a brand-new company before any session exists.
  execute(data: CreateUserDto) {
    return this.userService.create(data);
  }

  executeAuthorized(data: CreateUserDto, actingUser: AuthenticatedUser) {
    return this.userService.createAuthorized(data, actingUser);
  }
}
