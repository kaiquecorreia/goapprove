import { Injectable } from '@nestjs/common';
import { CompanyUser, Prisma, UserSubstitute } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserRepository, UserWithRelations } from './user.repository';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly users: UserWithRelations[] = [];
  private readonly companyUsers: CompanyUser[] = [];
  private readonly userSubstitutes: UserSubstitute[] = [];

  private buildUserWithRelations(userId: string): UserWithRelations | null {
    const user = this.users.find((u) => u.userId === userId);

    if (!user) {
      return null;
    }

    return {
      ...user,
      companies: this.companyUsers.filter((cu) => cu.userId === userId),
      substitutes: this.userSubstitutes.filter((us) => us.userId === userId),
      substitutedBy: this.userSubstitutes.filter(
        (us) => us.substituteId === userId,
      ),
    };
  }

  create(data: CreateUserDto): Promise<UserWithRelations> {
    const existingEmail = this.users.find((u) => u.email === data.email);

    if (existingEmail) {
      throw new Error('Unique constraint violation');
    }

    const existingExternal = this.users.find(
      (u) => u.externalIntegrationUser === data.externalIntegrationUser,
    );

    if (existingExternal) {
      throw new Error('Unique constraint violation');
    }

    const userId = uuidv4();
    const now = new Date();

    const user: UserWithRelations = {
      userId,
      name: data.name,
      email: data.email,
      externalIntegrationUser: data.externalIntegrationUser,
      role: data.role,
      active: data.active ?? true,
      approvalLimit:
        data.approvalLimit !== undefined
          ? new Prisma.Decimal(data.approvalLimit)
          : null,
      createdAt: now,
      updatedAt: now,
      companies: [],
      substitutes: [],
      substitutedBy: [],
    };

    this.users.push(user);

    if (data.companyIds && data.companyIds.length > 0) {
      for (const companyId of data.companyIds) {
        const pivot: CompanyUser = {
          companyId,
          userId,
          isDefault: false,
          createdAt: now,
        };
        this.companyUsers.push(pivot);
      }
    }

    if (data.substituteIds && data.substituteIds.length > 0) {
      for (const substituteId of data.substituteIds) {
        const pivot: UserSubstitute = {
          userId,
          substituteId,
          priority: 1,
          createdAt: now,
        };
        this.userSubstitutes.push(pivot);
      }
    }

    return Promise.resolve(
      this.buildUserWithRelations(userId) as UserWithRelations,
    );
  }

  async findById(userId: string): Promise<UserWithRelations | null> {
    return Promise.resolve(this.buildUserWithRelations(userId));
  }

  async findAll(): Promise<UserWithRelations[]> {
    return Promise.resolve(
      this.users.map(
        (u) => this.buildUserWithRelations(u.userId) as UserWithRelations,
      ),
    );
  }

  async update(
    userId: string,
    data: UpdateUserDto,
  ): Promise<UserWithRelations | null> {
    const index = this.users.findIndex((u) => u.userId === userId);

    if (index === -1) {
      return Promise.resolve(null);
    }

    const existing = this.users[index];

    if (data.email && data.email !== existing.email) {
      const duplicate = this.users.find(
        (u) => u.userId !== userId && u.email === data.email,
      );

      if (duplicate) {
        throw new Error('Unique constraint violation');
      }
    }

    if (
      data.externalIntegrationUser &&
      data.externalIntegrationUser !== existing.externalIntegrationUser
    ) {
      const duplicate = this.users.find(
        (u) =>
          u.userId !== userId &&
          u.externalIntegrationUser === data.externalIntegrationUser,
      );

      if (duplicate) {
        throw new Error('Unique constraint violation');
      }
    }

    const { companyIds, substituteIds, approvalLimit, ...scalarData } = data;

    this.users[index] = {
      ...existing,
      ...scalarData,
      approvalLimit:
        approvalLimit !== undefined
          ? new Prisma.Decimal(approvalLimit)
          : existing.approvalLimit,
      updatedAt: new Date(),
      companies: existing.companies,
      substitutes: existing.substitutes,
      substitutedBy: existing.substitutedBy,
    };

    if (companyIds !== undefined) {
      const idx = this.companyUsers.reduce<number[]>((acc, cu, i) => {
        if (cu.userId === userId) acc.push(i);
        return acc;
      }, []);

      for (const i of idx.reverse()) {
        this.companyUsers.splice(i, 1);
      }

      for (const companyId of companyIds) {
        this.companyUsers.push({
          companyId,
          userId,
          isDefault: false,
          createdAt: new Date(),
        });
      }
    }

    if (substituteIds !== undefined) {
      const idx = this.userSubstitutes.reduce<number[]>((acc, us, i) => {
        if (us.userId === userId) acc.push(i);
        return acc;
      }, []);

      for (const i of idx.reverse()) {
        this.userSubstitutes.splice(i, 1);
      }

      for (const substituteId of substituteIds) {
        this.userSubstitutes.push({
          userId,
          substituteId,
          priority: 1,
          createdAt: new Date(),
        });
      }
    }

    return Promise.resolve(
      this.buildUserWithRelations(userId) as UserWithRelations,
    );
  }
}
