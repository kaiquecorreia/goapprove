import { Injectable } from '@nestjs/common';

import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LoginUseCase {
  constructor(private readonly authService: AuthService) {}

  execute(dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
