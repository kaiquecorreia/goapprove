import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { CreateRuleDto } from './dtos/create-rule.dto';
import { SetRuleStatusDto } from './dtos/set-rule-status.dto';
import { UpdateRuleDto } from './dtos/update-rule.dto';
import { CreateRuleUseCase } from './use-cases/create-rule.use-case';
import { DeleteRuleUseCase } from './use-cases/delete-rule.use-case';
import { GetRuleUseCase } from './use-cases/get-rule.use-case';
import { SetRuleStatusUseCase } from './use-cases/set-rule-status.use-case';
import { UpdateRuleUseCase } from './use-cases/update-rule.use-case';

const RULE_MANAGEMENT_ROLES = [
  UserRole.RULES_MANAGER,
  UserRole.ADMINISTRATOR,
  UserRole.OWNER,
];

@ApiTags('Rule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rules')
export class RuleController {
  constructor(
    private readonly createRuleUseCase: CreateRuleUseCase,
    private readonly getRuleUseCase: GetRuleUseCase,
    private readonly updateRuleUseCase: UpdateRuleUseCase,
    private readonly setRuleStatusUseCase: SetRuleStatusUseCase,
    private readonly deleteRuleUseCase: DeleteRuleUseCase,
  ) {}

  @Post()
  @Roles(...RULE_MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Create a new business rule' })
  @ApiBody({ type: CreateRuleDto })
  @ApiResponse({ status: 201, description: 'Rule created successfully' })
  @ApiResponse({ status: 409, description: 'Rule code already exists' })
  create(@Body() data: CreateRuleDto) {
    return this.createRuleUseCase.execute(data);
  }

  @Get()
  @ApiOperation({ summary: 'List rules, optionally filtered by company' })
  @ApiQuery({ name: 'companyId', required: false, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Rules listed successfully' })
  findAll(@Query('companyId') companyId?: string) {
    return this.getRuleUseCase.executeAll(companyId);
  }

  @Get(':ruleId')
  @ApiOperation({ summary: 'Get a rule by id' })
  @ApiParam({ name: 'ruleId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Rule found' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  findById(
    @Param('ruleId', new ParseUUIDPipe({ version: '4' })) ruleId: string,
  ) {
    return this.getRuleUseCase.executeById(ruleId);
  }

  @Patch(':ruleId')
  @Roles(...RULE_MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Update a rule' })
  @ApiParam({ name: 'ruleId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateRuleDto })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  update(
    @Param('ruleId', new ParseUUIDPipe({ version: '4' })) ruleId: string,
    @Body() data: UpdateRuleDto,
  ) {
    return this.updateRuleUseCase.execute(ruleId, data);
  }

  @Patch(':ruleId/status')
  @Roles(...RULE_MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Activate or deactivate a rule' })
  @ApiParam({ name: 'ruleId', type: String, format: 'uuid' })
  @ApiBody({ type: SetRuleStatusDto })
  @ApiResponse({ status: 200, description: 'Rule status updated' })
  setStatus(
    @Param('ruleId', new ParseUUIDPipe({ version: '4' })) ruleId: string,
    @Body() dto: SetRuleStatusDto,
  ) {
    return this.setRuleStatusUseCase.execute(ruleId, dto.status);
  }

  @Delete(':ruleId')
  @Roles(...RULE_MANAGEMENT_ROLES)
  @ApiOperation({ summary: 'Soft-delete (deactivate) a rule' })
  @ApiParam({ name: 'ruleId', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Rule deactivated' })
  remove(@Param('ruleId', new ParseUUIDPipe({ version: '4' })) ruleId: string) {
    return this.deleteRuleUseCase.execute(ruleId);
  }
}
