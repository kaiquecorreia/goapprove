import { Controller } from '@nestjs/common';

@Controller('user')
export class UserRepository {
  check() {
    return { status: 'ok' };
  }
}
