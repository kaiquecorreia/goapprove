import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateOnboardingDto } from './dtos/create-onboarding.dto';
import { CreateOnboardingUseCase } from './use-cases/create-onboarding.use-case';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly createOnboardingUseCase: CreateOnboardingUseCase,
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
}
