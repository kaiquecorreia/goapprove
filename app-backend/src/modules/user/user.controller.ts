import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUserDto } from './dtos/create-user.dto';
import { SetPasswordDto } from './dtos/set-password.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { SetUserPasswordUseCase } from './use-cases/set-user-password.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';

@ApiTags('User')
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
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({
    status: 409,
    description: 'Email or external integration user already exists',
  })
  create(@Body() data: CreateUserDto) {
    return this.createUserUseCase.execute(data);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users listed successfully' })
  findAll() {
    return this.getUserUseCase.executeAll();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findById(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.getUserUseCase.executeById(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update a user' })
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
  ) {
    return this.updateUserUseCase.execute(userId, data);
  }

  @Patch(':userId/password')
  @HttpCode(204)
  @ApiOperation({ summary: "Set or reset a user's password" })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({ status: 204, description: 'Password updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setPassword(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() data: SetPasswordDto,
  ) {
    await this.setUserPasswordUseCase.execute(userId, data);
  }
}
