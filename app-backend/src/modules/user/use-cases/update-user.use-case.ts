import { Injectable } from '@nestjs/common';

import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserService } from '../services/user.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userService: UserService) {}

  execute(userId: string, data: UpdateUserDto) {
    return this.userService.update(userId, data);
  }
}
