import { CompanyUser, User, UserSubstitute } from '@prisma/client';

import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export type UserWithRelations = Omit<User, 'passwordHash'> & {
  companies: CompanyUser[];
  substitutes: UserSubstitute[];
  substitutedBy: UserSubstitute[];
};

export type UserWithPasswordHash = UserWithRelations & {
  passwordHash: string | null;
};

// The service hashes the plain `password` from CreateUserDto before it
// reaches the repository — repositories only ever persist the hash.
export type CreateUserData = Omit<CreateUserDto, 'password'> & {
  passwordHash: string;
};

export abstract class UserRepository {
  abstract create(data: CreateUserData): Promise<UserWithRelations>;
  abstract findById(userId: string): Promise<UserWithRelations | null>;
  abstract findAll(companyIds?: string[]): Promise<UserWithRelations[]>;
  abstract findByExternalIntegrationUser(
    externalIntegrationUser: string,
  ): Promise<UserWithRelations | null>;
  // Only for the login use case — the only place allowed to read the hash.
  abstract findByEmailForAuth(
    email: string,
  ): Promise<UserWithPasswordHash | null>;
  abstract update(
    userId: string,
    data: UpdateUserDto,
  ): Promise<UserWithRelations | null>;
  abstract updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<UserWithRelations | null>;
}
