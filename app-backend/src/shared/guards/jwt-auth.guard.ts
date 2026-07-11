import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { AuthenticatedUser } from '../types/authenticated-user';

interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
  companyId?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      request.user = {
        userId: payload.sub,
        role: payload.role,
        email: payload.email,
        companyId: payload.companyId,
      } satisfies AuthenticatedUser;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;

    if (!header) {
      return undefined;
    }

    const [type, token] = header.split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
