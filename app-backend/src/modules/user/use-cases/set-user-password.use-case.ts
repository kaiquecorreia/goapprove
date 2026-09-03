import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { SetPasswordDto } from '../dtos/set-password.dto';
import { UserService } from '../services/user.service';

@Injectable()
export class SetUserPasswordUseCase {
  constructor(private readonly userService: UserService) {}

  execute(userId: string, data: SetPasswordDto, actingUser: AuthenticatedUser) {
    return this.userService.setPassword(userId, data.password, actingUser);
  }
}
