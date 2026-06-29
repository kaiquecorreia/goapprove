import { Injectable } from '@nestjs/common';

import { AuthService } from '../services/auth.service';

@Injectable()
export class GetIntegrationConfigUseCase {
  constructor(private readonly authService: AuthService) {}

  execute(externalIntegrationUser: string) {
    return this.authService.getIntegrationConfig(externalIntegrationUser);
  }
}
