import { Injectable } from '@nestjs/common';

import { UserService } from '../services/user.service';

@Injectable()
export class GetUserUseCase {
  constructor(private readonly userService: UserService) {}

  executeById(userId: string) {
    return this.userService.findById(userId);
  }

  executeAll() {
    return this.userService.findAll();
  }
}
