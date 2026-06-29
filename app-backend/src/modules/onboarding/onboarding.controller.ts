import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateOnboardingDto } from './dtos/create-onboarding.dto';
import { IntegrationQueryDto } from './dtos/integration-query.dto';
import { UpdateIntegrationDto } from './dtos/update-integration.dto';
import { CreateOnboardingUseCase } from './use-cases/create-onboarding.use-case';
import { GetCompanyIntegrationUseCase } from './use-cases/get-company-integration.use-case';
import { UpdateCompanyIntegrationUseCase } from './use-cases/update-company-integration.use-case';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly createOnboardingUseCase: CreateOnboardingUseCase,
    private readonly getCompanyIntegrationUseCase: GetCompanyIntegrationUseCase,
    private readonly updateCompanyIntegrationUseCase: UpdateCompanyIntegrationUseCase,
  ) {}

  @Post('company')
  @ApiOperation({ summary: 'Onboard a new company with its admin user' })
  @ApiBody({ type: CreateOnboardingDto })
  @ApiResponse({ status: 201, description: 'Company onboarded successfully' })
  @ApiResponse({
    status: 409,
    description:
      'Company with this cnpj or external integration code already exists',
  })
  create(@Body() data: CreateOnboardingDto) {
    return this.createOnboardingUseCase.execute(data);
  }

  @Get('company/:companyId/integration')
  @ApiOperation({
    summary: "Get a company's Infor integration config (masked secret)",
  })
  @ApiResponse({ status: 200, description: 'Integration found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  getIntegration(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Query() query: IntegrationQueryDto,
  ) {
    return this.getCompanyIntegrationUseCase.execute(
      companyId,
      query.actingExternalIntegrationUser,
    );
  }

  @Patch('company/:companyId/integration')
  @ApiOperation({ summary: "Update a company's Infor integration config" })
  @ApiBody({ type: UpdateIntegrationDto })
  @ApiResponse({ status: 200, description: 'Integration updated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  updateIntegration(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Body() data: UpdateIntegrationDto,
  ) {
    return this.updateCompanyIntegrationUseCase.execute(companyId, data);
  }
}
