import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async create(data: CreateUserDto) {
    return this.prismaService.runInTransaction(async () => {
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
    return this.prismaService.runInTransaction(async () => {
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

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
