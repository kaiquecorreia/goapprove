import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../shared/types/authenticated-user';
import { Audit } from '../audit/decorators/audit.decorator';
import { CreateUserDto } from './dtos/create-user.dto';
import { SetPasswordDto } from './dtos/set-password.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { SetUserPasswordUseCase } from './use-cases/set-user-password.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly setUserPasswordUseCase: SetUserPasswordUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @Audit({ action: 'user.create', entity: 'User' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Email or external integration user already exists',
  })
  create(
    @Body() data: CreateUserDto,
    @CurrentUser() actingUser: AuthenticatedUser,
  ) {
    return this.createUserUseCase.executeAuthorized(data, actingUser);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users listed successfully' })
  findAll(@CurrentUser() actingUser: AuthenticatedUser) {
    return this.getUserUseCase.executeAll(actingUser);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findById(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @CurrentUser() actingUser: AuthenticatedUser,
  ) {
    return this.getUserUseCase.executeById(userId, actingUser);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update a user' })
  @Audit({ action: 'user.update', entity: 'User' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'User cannot be their own substitute',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description: 'Email or external integration user already exists',
  })
  update(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() data: UpdateUserDto,
    @CurrentUser() actingUser: AuthenticatedUser,
  ) {
    return this.updateUserUseCase.execute(userId, data, actingUser);
  }

  @Patch(':userId/password')
  @HttpCode(204)
  @Audit({
    action: 'user.set_password',
    entity: 'User',
    severity: 'warning',
    // The handler returns nothing and the body is a credential.
    captureAfter: false,
  })
  @ApiOperation({ summary: "Set or reset a user's password" })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({ status: 204, description: 'Password updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setPassword(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() data: SetPasswordDto,
    @CurrentUser() actingUser: AuthenticatedUser,
  ) {
    await this.setUserPasswordUseCase.execute(userId, data, actingUser);
  }
}
