import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { TransactionService } from '../../../shared/prisma/transaction.service';
import { PasswordService } from '../../../shared/password/password.service';
import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CompanyAccessService } from '../../company/services/company-access.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly transactionService: TransactionService,
    private readonly passwordService: PasswordService,
    private readonly companyAccessService: CompanyAccessService,
  ) {}

  // Unauthenticated bootstrap primitive — used only by the public onboarding flow to
  // create the very first OWNER of a brand-new company, before the company link (and
  // therefore `assertCompanyRequirement`) can be satisfied. No authorization here.
  async create(data: CreateUserDto) {
    const { password, ...rest } = data;
    const passwordHash = await this.passwordService.hash(password);

    return this.transactionService.run(async () => {
      try {
        return await this.userRepository.create({ ...rest, passwordHash });
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException(
            'A user with this email or external integration user already exists',
          );
        }

        throw error;
      }
    });
  }

  async createAuthorized(data: CreateUserDto, actingUser: AuthenticatedUser) {
    this.assertAdminRoleMutationAllowed(actingUser, data.role);
    await this.companyAccessService.assertCompanyAccess(
      actingUser,
      data.companyIds ?? [],
      'all',
    );
    this.assertCompanyRequirement(data.role, data.companyIds);

    return this.create(data);
  }

  async findById(userId: string, actingUser: AuthenticatedUser) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    await this.companyAccessService.assertCompanyAccess(
      actingUser,
      user.companies.map((c) => c.companyId),
    );
    this.assertAdminRoleMutationAllowed(actingUser, user.role);

    return user;
  }

  async findAll(actingUser: AuthenticatedUser) {
    const accessibleCompanyIds =
      await this.companyAccessService.getAccessibleCompanyIds(actingUser);

    return this.userRepository.findAll(accessibleCompanyIds ?? undefined);
  }

  async update(
    userId: string,
    data: UpdateUserDto,
    actingUser: AuthenticatedUser,
  ) {
    return this.transactionService.run(async () => {
      const existing = await this.userRepository.findById(userId);

      if (!existing) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      await this.companyAccessService.assertCompanyAccess(
        actingUser,
        existing.companies.map((c) => c.companyId),
      );
      this.assertAdminRoleMutationAllowed(actingUser, existing.role);

      const effectiveRole = data.role ?? existing.role;
      this.assertAdminRoleMutationAllowed(actingUser, effectiveRole);

      if (data.companyIds) {
        await this.companyAccessService.assertCompanyAccess(
          actingUser,
          data.companyIds,
          'all',
        );
      }

      const effectiveCompanyIds =
        data.companyIds ?? existing.companies.map((c) => c.companyId);
      this.assertCompanyRequirement(effectiveRole, effectiveCompanyIds);

      if (data.substituteIds?.length) {
        if (data.substituteIds.includes(userId)) {
          throw new BadRequestException(
            'A user cannot be their own substitute',
          );
        }
      }

      try {
        const user = await this.userRepository.update(userId, data);

        if (!user) {
          throw new NotFoundException(`User with id ${userId} not found`);
        }

        return user;
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException(
            'A user with this email or external integration user already exists',
          );
        }

        throw error;
      }
    });
  }

  async setPassword(
    userId: string,
    plainPassword: string,
    actingUser: AuthenticatedUser,
  ) {
    const existing = await this.userRepository.findById(userId);

    if (!existing) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    await this.companyAccessService.assertCompanyAccess(
      actingUser,
      existing.companies.map((c) => c.companyId),
    );
    this.assertAdminRoleMutationAllowed(actingUser, existing.role);

    const passwordHash = await this.passwordService.hash(plainPassword);
    const user = await this.userRepository.updatePasswordHash(
      userId,
      passwordHash,
    );

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user;
  }

  private assertAdminRoleMutationAllowed(
    actingUser: AuthenticatedUser,
    targetRole: UserRole,
  ) {
    if (
      targetRole === UserRole.ADMINISTRATOR &&
      actingUser.role !== UserRole.ADMINISTRATOR
    ) {
      throw new ForbiddenException(
        'Only an ADMINISTRATOR can manage ADMINISTRATOR users',
      );
    }
  }

  private assertCompanyRequirement(role: UserRole, companyIds?: string[]) {
    if (
      role !== UserRole.ADMINISTRATOR &&
      (!companyIds || companyIds.length === 0)
    ) {
      throw new BadRequestException(
        'Users with a role other than ADMINISTRATOR must be associated to at least one company',
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
