import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { InforLoginEnabledGuard } from '../../shared/guards/infor-login-enabled.guard';
import { AuthCallbackDto } from './dtos/auth-callback.dto';
import { IntegrationLookupQueryDto } from './dtos/integration-lookup-query.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthCallbackUseCase } from './use-cases/auth-callback.use-case';
import { GetIntegrationConfigUseCase } from './use-cases/get-integration-config.use-case';
import { LoginUseCase } from './use-cases/login.use-case';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly getIntegrationConfigUseCase: GetIntegrationConfigUseCase,
    private readonly authCallbackUseCase: AuthCallbackUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Token issued' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @UseGuards(InforLoginEnabledGuard)
  @Post('callback')
  @ApiOperation({
    summary:
      'Exchange an authenticated Infor integration user for a GoApprove session token',
  })
  @ApiBody({ type: AuthCallbackDto })
  @ApiResponse({ status: 200, description: 'Token issued' })
  @ApiResponse({ status: 404, description: 'User not found or not authorized' })
  callback(@Body() dto: AuthCallbackDto) {
    return this.authCallbackUseCase.execute(dto.externalIntegrationUser);
  }

  @UseGuards(InforLoginEnabledGuard)
  @Get('integration-lookup')
  @ApiOperation({
    summary:
      "Look up a registered user's company Infor integration config, for dynamic OAuth login",
  })
  @ApiResponse({ status: 200, description: 'Integration config found' })
  @ApiResponse({ status: 404, description: 'User not found or not authorized' })
  integrationLookup(@Query() query: IntegrationLookupQueryDto) {
    return this.getIntegrationConfigUseCase.execute(
      query.externalIntegrationUser,
    );
  }
}
