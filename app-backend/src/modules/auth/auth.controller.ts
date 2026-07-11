import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthCallbackDto } from './dtos/auth-callback.dto';
import { IntegrationLookupQueryDto } from './dtos/integration-lookup-query.dto';
import { AuthCallbackUseCase } from './use-cases/auth-callback.use-case';
import { GetIntegrationConfigUseCase } from './use-cases/get-integration-config.use-case';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly getIntegrationConfigUseCase: GetIntegrationConfigUseCase,
    private readonly authCallbackUseCase: AuthCallbackUseCase,
  ) {}

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
