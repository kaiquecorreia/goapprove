import { CompanyUser, User, UserSubstitute } from '@prisma/client';

import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export type UserWithRelations = User & {
  companies: CompanyUser[];
  substitutes: UserSubstitute[];
  substitutedBy: UserSubstitute[];
};

export abstract class UserRepository {
  abstract create(data: CreateUserDto): Promise<UserWithRelations>;
  abstract findById(userId: string): Promise<UserWithRelations | null>;
  abstract findAll(): Promise<UserWithRelations[]>;
  abstract update(
    userId: string,
    data: UpdateUserDto,
  ): Promise<UserWithRelations | null>;
}
