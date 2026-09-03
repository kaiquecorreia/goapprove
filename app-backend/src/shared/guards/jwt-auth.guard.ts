import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../types/authenticated-user';

interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
  companyId?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prismaService.getClient().user.findUnique({
      where: { userId: payload.sub },
      select: { userId: true, active: true, role: true, email: true },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }

    request.user = {
      userId: user.userId,
      role: user.role,
      email: user.email,
      companyId: payload.companyId,
    } satisfies AuthenticatedUser;

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
