import { Injectable } from '@nestjs/common';

import { SetPasswordDto } from '../dtos/set-password.dto';
import { UserService } from '../services/user.service';

@Injectable()
export class SetUserPasswordUseCase {
  constructor(private readonly userService: UserService) {}

  execute(userId: string, data: SetPasswordDto) {
    return this.userService.setPassword(userId, data.password);
  }
}
