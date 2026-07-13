import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class InforLoginEnabledGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.ENABLE_INFOR_LOGIN !== 'true') {
      throw new ForbiddenException(
        'Infor integration login is currently disabled',
      );
    }

    return true;
  }
}
