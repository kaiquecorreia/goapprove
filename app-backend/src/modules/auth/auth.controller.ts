import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { IntegrationLookupQueryDto } from './dtos/integration-lookup-query.dto';
import { GetIntegrationConfigUseCase } from './use-cases/get-integration-config.use-case';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly getIntegrationConfigUseCase: GetIntegrationConfigUseCase,
  ) {}

  @Post('callback')
  check() {
    return { status: 'ok' };
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
