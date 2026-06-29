import { Controller, Get } from '@nestjs/common';

import { Public } from '../../shared/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'ok' };
  }
}
