import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { UserService } from '../services/user.service';

@Injectable()
export class GetUserUseCase {
  constructor(private readonly userService: UserService) {}

  executeById(userId: string, actingUser: AuthenticatedUser) {
    return this.userService.findById(userId, actingUser);
  }

  executeAll(actingUser: AuthenticatedUser) {
    return this.userService.findAll(actingUser);
  }
}
