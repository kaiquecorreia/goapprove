import { Injectable } from '@nestjs/common';

import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthCallbackUseCase {
  constructor(private readonly authService: AuthService) {}

  execute(externalIntegrationUser: string) {
    return this.authService.issueSessionToken(externalIntegrationUser);
  }
}
