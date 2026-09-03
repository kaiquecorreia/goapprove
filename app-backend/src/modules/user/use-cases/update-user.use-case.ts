import { Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserService } from '../services/user.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userService: UserService) {}

  execute(userId: string, data: UpdateUserDto, actingUser: AuthenticatedUser) {
    return this.userService.update(userId, data, actingUser);
  }
}
