import { Module } from '@nestjs/common';

import { AppJwtModule } from '../../shared/jwt/app-jwt.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PasswordModule } from '../../shared/password/password.module';
import { CompanyModule } from '../company/company.module';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { SetUserPasswordUseCase } from './use-cases/set-user-password.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { UserController } from './user.controller';

@Module({
  imports: [PrismaModule, PasswordModule, AppJwtModule, CompanyModule],
  controllers: [UserController],
  providers: [
    PrismaService,
    UserService,
    CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    SetUserPasswordUseCase,
    { provide: UserRepository, useClass: PrismaUserRepository },
  ],
  exports: [UserRepository, UserService, CreateUserUseCase],
})
export class UserModule {}
