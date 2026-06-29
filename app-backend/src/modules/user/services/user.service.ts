import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { TransactionService } from '../../../shared/prisma/transaction.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly transactionService: TransactionService,
  ) {}

  async create(data: CreateUserDto) {
    this.assertCompanyRequirement(data.role, data.companyIds);

    return this.transactionService.run(async () => {
      try {
        return await this.userRepository.create(data);
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

  async findById(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user;
  }

  async findAll() {
    return this.userRepository.findAll();
  }

  async update(userId: string, data: UpdateUserDto) {
    return this.transactionService.run(async () => {
      const existing = await this.userRepository.findById(userId);

      if (!existing) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      const effectiveRole = data.role ?? existing.role;
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
