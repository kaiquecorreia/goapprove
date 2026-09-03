import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RuleStatus, UserRole } from '@prisma/client';

import { CompanyAccessService } from '../../company/services/company-access.service';
import { CompanyUserRepository } from '../../company/repositories/company-user.repository';
import { UserRepository } from '../../user/repositories/user.repository';
import { TransactionService } from '../../../shared/prisma/transaction.service';
import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CreateRuleDto } from '../dtos/create-rule.dto';
import { UpdateRuleDto } from '../dtos/update-rule.dto';
import { RuleRepository } from '../repositories/rule.repository';

const APPROVER_ROLES: UserRole[] = [
  UserRole.APPROVER,
  UserRole.ADMINISTRATOR,
  UserRole.OWNER,
];

const NON_VALUE_OPERATORS = [
  'EXISTS',
  'NOT_EXISTS',
  'BETWEEN',
  'IN_LIST',
  'NOT_IN_LIST',
];

@Injectable()
export class RuleService {
  constructor(
    private readonly ruleRepository: RuleRepository,
    private readonly userRepository: UserRepository,
    private readonly companyUserRepository: CompanyUserRepository,
    private readonly transactionService: TransactionService,
    private readonly companyAccessService: CompanyAccessService,
  ) {}

  async create(data: CreateRuleDto, actingUser: AuthenticatedUser) {
    await this.companyAccessService.assertCompanyAccess(actingUser, [
      data.companyId,
    ]);
    this.validateConditions(data.conditions);
    await this.validateLevels(data.levels, data.companyId);

    return this.transactionService.run(async () => {
      try {
        return await this.ruleRepository.create(data);
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException('A rule with this code already exists');
        }

        throw error;
      }
    });
  }

  async findById(ruleId: string, actingUser: AuthenticatedUser) {
    const rule = await this.ruleRepository.findById(ruleId);

    if (!rule) {
      throw new NotFoundException(`Rule with id ${ruleId} not found`);
    }

    await this.companyAccessService.assertCompanyAccess(actingUser, [
      rule.companyId,
    ]);

    return rule;
  }

  async findAll(companyId: string | undefined, actingUser: AuthenticatedUser) {
    const accessibleCompanyIds =
      await this.companyAccessService.getAccessibleCompanyIds(actingUser);

    if (accessibleCompanyIds === null) {
      return this.ruleRepository.findAll(companyId ? { companyId } : undefined);
    }

    if (companyId) {
      await this.companyAccessService.assertCompanyAccess(actingUser, [
        companyId,
      ]);
      return this.ruleRepository.findAll({ companyId });
    }

    return this.ruleRepository.findAll({ companyIds: accessibleCompanyIds });
  }

  async update(
    ruleId: string,
    data: UpdateRuleDto,
    actingUser: AuthenticatedUser,
  ) {
    if (data.conditions) {
      this.validateConditions(data.conditions);
    }

    return this.transactionService.run(async () => {
      const existing = await this.ruleRepository.findById(ruleId);

      if (!existing) {
        throw new NotFoundException(`Rule with id ${ruleId} not found`);
      }

      await this.companyAccessService.assertCompanyAccess(actingUser, [
        existing.companyId,
      ]);

      if (data.companyId && data.companyId !== existing.companyId) {
        await this.companyAccessService.assertCompanyAccess(actingUser, [
          data.companyId,
        ]);
      }

      if (data.levels) {
        await this.validateLevels(
          data.levels,
          data.companyId ?? existing.companyId,
        );
      }

      try {
        const rule = await this.ruleRepository.update(ruleId, data);

        if (!rule) {
          throw new NotFoundException(`Rule with id ${ruleId} not found`);
        }

        return rule;
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          throw new ConflictException('A rule with this code already exists');
        }

        throw error;
      }
    });
  }

  async setStatus(
    ruleId: string,
    status: RuleStatus,
    actingUser: AuthenticatedUser,
  ) {
    return this.transactionService.run(async () => {
      const existing = await this.ruleRepository.findById(ruleId);

      if (!existing) {
        throw new NotFoundException(`Rule with id ${ruleId} not found`);
      }

      await this.companyAccessService.assertCompanyAccess(actingUser, [
        existing.companyId,
      ]);

      const rule = await this.ruleRepository.update(ruleId, { status });

      if (!rule) {
        throw new NotFoundException(`Rule with id ${ruleId} not found`);
      }

      return rule;
    });
  }

  async delete(ruleId: string, actingUser: AuthenticatedUser) {
    return this.setStatus(ruleId, RuleStatus.INACTIVE, actingUser);
  }

  private validateConditions(conditions: CreateRuleDto['conditions']) {
    for (const condition of conditions) {
      if (condition.operator === 'BETWEEN' && !condition.valueTo) {
        throw new BadRequestException('BETWEEN operator requires a valueTo');
      }

      if (
        (condition.operator === 'IN_LIST' ||
          condition.operator === 'NOT_IN_LIST') &&
        (!condition.valueList || condition.valueList.length === 0)
      ) {
        throw new BadRequestException(
          `${condition.operator} operator requires a non-empty valueList`,
        );
      }

      if (
        !NON_VALUE_OPERATORS.includes(condition.operator) &&
        condition.value === undefined
      ) {
        throw new BadRequestException(
          `${condition.operator} operator requires a value`,
        );
      }
    }
  }

  private async validateLevels(
    levels: CreateRuleDto['levels'],
    companyId: string,
  ) {
    const approverIds = Array.from(
      new Set(levels.flatMap((level) => level.approverUserIds)),
    );
    const companyUsers =
      await this.companyUserRepository.findByCompanyId(companyId);
    const companyUserIds = new Set(companyUsers.map((cu) => cu.userId));

    for (const userId of approverIds) {
      const user = await this.userRepository.findById(userId);

      if (!user || !user.active) {
        throw new BadRequestException(
          `Approver ${userId} is not an active user`,
        );
      }

      if (!APPROVER_ROLES.includes(user.role)) {
        throw new BadRequestException(
          `User ${userId} does not have an approver-eligible role`,
        );
      }

      if (!companyUserIds.has(userId)) {
        throw new BadRequestException(
          `User ${userId} is not linked to company ${companyId}`,
        );
      }
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
