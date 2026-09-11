import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateRuleDto } from '../dtos/create-rule.dto';
import { UpdateRuleDto } from '../dtos/update-rule.dto';
import { RuleWithRelations } from '../types/rule-with-relations';
import { RuleRepository } from './rule.repository';

const RULE_INCLUDE = {
  conditions: true,
  levels: {
    include: {
      approvers: {
        include: { user: { omit: { passwordHash: true } } },
      },
    },
    orderBy: { levelNumber: 'asc' },
  },
} satisfies Prisma.RuleInclude;

@Injectable()
export class PrismaRuleRepository implements RuleRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: CreateRuleDto): Promise<RuleWithRelations> {
    return this.prismaService.getClient().rule.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        companyId: data.companyId,
        priority: data.priority,
        validFrom: new Date(data.validFrom),
        validTo: data.validTo ? new Date(data.validTo) : null,
        status: data.status,
        ruleType: data.ruleType,
        conflictStrategy: data.conflictStrategy,
        conditions: {
          create: data.conditions.map((condition) =>
            this.toConditionData(condition),
          ),
        },
        levels: {
          create: data.levels.map((level) => this.toLevelData(level)),
        },
      },
      include: RULE_INCLUDE,
    });
  }

  async findById(ruleId: string): Promise<RuleWithRelations | null> {
    return this.prismaService.getClient().rule.findUnique({
      where: { ruleId },
      include: RULE_INCLUDE,
    });
  }

  async findByCode(code: string): Promise<RuleWithRelations | null> {
    return this.prismaService.getClient().rule.findUnique({
      where: { code },
      include: RULE_INCLUDE,
    });
  }

  async findAll(filter?: {
    companyId?: string;
    companyIds?: string[];
  }): Promise<RuleWithRelations[]> {
    const where = filter?.companyId
      ? { companyId: filter.companyId }
      : filter?.companyIds
        ? { companyId: { in: filter.companyIds } }
        : undefined;

    return this.prismaService.getClient().rule.findMany({
      where,
      include: RULE_INCLUDE,
      orderBy: { priority: 'asc' },
    });
  }

  async findActiveCandidates(
    companyId: string,
    now: Date,
  ): Promise<RuleWithRelations[]> {
    return this.prismaService.getClient().rule.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      include: RULE_INCLUDE,
      orderBy: { priority: 'asc' },
    });
  }

  async update(
    ruleId: string,
    data: UpdateRuleDto,
  ): Promise<RuleWithRelations | null> {
    const client = this.prismaService.getClient();

    const existing = await client.rule.findUnique({ where: { ruleId } });

    if (!existing) {
      return null;
    }

    if (data.conditions) {
      await client.ruleCondition.deleteMany({ where: { ruleId } });
    }

    if (data.levels) {
      await client.ruleLevel.deleteMany({ where: { ruleId } });
    }

    return client.rule.update({
      where: { ruleId },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        companyId: data.companyId,
        priority: data.priority,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validTo:
          data.validTo !== undefined
            ? data.validTo
              ? new Date(data.validTo)
              : null
            : undefined,
        status: data.status,
        ruleType: data.ruleType,
        conflictStrategy: data.conflictStrategy,
        conditions: data.conditions
          ? {
              create: data.conditions.map((condition) =>
                this.toConditionData(condition),
              ),
            }
          : undefined,
        levels: data.levels
          ? {
              create: data.levels.map((level) => this.toLevelData(level)),
            }
          : undefined,
      },
      include: RULE_INCLUDE,
    });
  }

  private toConditionData(condition: CreateRuleDto['conditions'][number]) {
    return {
      sourceType: condition.sourceType,
      field: condition.field,
      operator: condition.operator,
      value: condition.value,
      valueTo: condition.valueTo,
      valueList: condition.valueList as Prisma.InputJsonValue | undefined,
    };
  }

  private toLevelData(level: CreateRuleDto['levels'][number]) {
    return {
      levelNumber: level.levelNumber,
      mode: level.mode,
      approvers: {
        create: level.approverUserIds.map((userId) => ({ userId })),
      },
    };
  }
}
