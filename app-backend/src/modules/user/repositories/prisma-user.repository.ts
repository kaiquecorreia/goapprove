import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UpdateUserDto } from '../dtos/update-user.dto';
import {
  CreateUserData,
  UserRepository,
  UserWithPasswordHash,
  UserWithRelations,
} from './user.repository';

const USER_INCLUDE = {
  companies: true,
  substitutes: true,
  substitutedBy: true,
} as const;

const USER_OMIT = {
  passwordHash: true,
} as const;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreateUserData): Promise<UserWithRelations> {
    const { companyIds, substituteIds, ...userData } = data;

    const client = this.prismaService.getClient();

    const user = await client.user.create({
      data: userData,
      include: USER_INCLUDE,
    });

    if (companyIds && companyIds.length > 0) {
      await client.companyUser.createMany({
        data: companyIds.map((companyId) => ({
          companyId,
          userId: user.userId,
        })),
      });
    }

    if (substituteIds && substituteIds.length > 0) {
      await client.userSubstitute.createMany({
        data: substituteIds.map((substituteId) => ({
          userId: user.userId,
          substituteId,
        })),
      });
    }

    return client.user.findUniqueOrThrow({
      where: { userId: user.userId },
      include: USER_INCLUDE,
      omit: USER_OMIT,
    });
  }

  async findById(userId: string): Promise<UserWithRelations | null> {
    return this.prismaService.getClient().user.findUnique({
      where: { userId },
      include: USER_INCLUDE,
      omit: USER_OMIT,
    });
  }

  async findAll(companyIds?: string[]): Promise<UserWithRelations[]> {
    return this.prismaService.getClient().user.findMany({
      where: companyIds
        ? { companies: { some: { companyId: { in: companyIds } } } }
        : undefined,
      include: USER_INCLUDE,
      omit: USER_OMIT,
    });
  }

  async findByExternalIntegrationUser(
    externalIntegrationUser: string,
  ): Promise<UserWithRelations | null> {
    return this.prismaService.getClient().user.findUnique({
      where: { externalIntegrationUser },
      include: USER_INCLUDE,
      omit: USER_OMIT,
    });
  }

  // Only for the login use case — the only place allowed to read the hash.
  async findByEmailForAuth(
    email: string,
  ): Promise<UserWithPasswordHash | null> {
    return this.prismaService.getClient().user.findUnique({
      where: { email },
      include: USER_INCLUDE,
    });
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<UserWithRelations | null> {
    const client = this.prismaService.getClient();

    const exists = await client.user.findUnique({ where: { userId } });

    if (!exists) {
      return null;
    }

    return client.user.update({
      where: { userId },
      data: { passwordHash },
      include: USER_INCLUDE,
      omit: USER_OMIT,
    });
  }

  async update(
    userId: string,
    data: UpdateUserDto,
  ): Promise<UserWithRelations | null> {
    const { companyIds, substituteIds, ...userData } = data;

    const client = this.prismaService.getClient();

    const exists = await client.user.findUnique({ where: { userId } });

    if (!exists) {
      return null;
    }

    if (companyIds !== undefined) {
      await client.companyUser.deleteMany({ where: { userId } });

      if (companyIds.length > 0) {
        await client.companyUser.createMany({
          data: companyIds.map((companyId) => ({ companyId, userId })),
        });
      }
    }

    if (substituteIds !== undefined) {
      await client.userSubstitute.deleteMany({ where: { userId } });

      if (substituteIds.length > 0) {
        await client.userSubstitute.createMany({
          data: substituteIds.map((substituteId) => ({
            userId,
            substituteId,
          })),
        });
      }
    }

    return client.user.update({
      where: { userId },
      data: userData,
      include: USER_INCLUDE,
      omit: USER_OMIT,
    });
  }
}
