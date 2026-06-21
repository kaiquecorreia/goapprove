import {
  Body,
  Controller,
  Get,
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

import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { CreateCompanyUseCase } from './use-cases/create-company.use-case';
import { GetCompanyUseCase } from './use-cases/get-company.use-case';
import { UpdateCompanyUseCase } from './use-cases/update-company.use-case';

@ApiTags('Company')
@Controller('company')
export class CompanyController {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly getCompanyUseCase: GetCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({
    status: 409,
    description: 'External integration code already exists',
  })
  create(@Body() data: CreateCompanyDto) {
    return this.createCompanyUseCase.execute(data);
  }

  @Get()
  @ApiOperation({ summary: 'List all companies' })
  @ApiResponse({ status: 200, description: 'Companies listed successfully' })
  findAll() {
    return this.getCompanyUseCase.executeAll();
  }

  @Get(':companyId')
  @ApiOperation({ summary: 'Get a company by id' })
  @ApiParam({ name: 'companyId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Company found' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findById(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
  ) {
    return this.getCompanyUseCase.executeById(companyId);
  }

  @Patch(':companyId')
  @ApiOperation({ summary: 'Update a company' })
  @ApiParam({ name: 'companyId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({
    status: 409,
    description: 'External integration code already exists',
  })
  update(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Body() data: UpdateCompanyDto,
  ) {
    return this.updateCompanyUseCase.execute(companyId, data);
  }
}
