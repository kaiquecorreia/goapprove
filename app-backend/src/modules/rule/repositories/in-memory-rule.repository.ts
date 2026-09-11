import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { CreateRuleDto } from '../dtos/create-rule.dto';
import { UpdateRuleDto } from '../dtos/update-rule.dto';
import { RuleWithRelations } from '../types/rule-with-relations';
import { RuleRepository } from './rule.repository';

function createStubUser(userId: string): User {
  return {
    userId,
    name: '',
    email: `${userId}@stub.local`,
    externalIntegrationUser: userId,
    passwordHash: null,
    role: UserRole.APPROVER,
    active: true,
    approvalLimit: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

@Injectable()
export class InMemoryRuleRepository implements RuleRepository {
  private readonly rules: RuleWithRelations[] = [];

  create(data: CreateRuleDto): Promise<RuleWithRelations> {
    const existing = this.rules.find((rule) => rule.code === data.code);

    if (existing) {
      throw new Error('Unique constraint violation');
    }

    const now = new Date();
    const ruleId = uuidv4();

    const rule: RuleWithRelations = {
      ruleId,
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      companyId: data.companyId,
      priority: data.priority,
      validFrom: new Date(data.validFrom),
      validTo: data.validTo ? new Date(data.validTo) : null,
      status: data.status ?? 'ACTIVE',
      ruleType: data.ruleType ?? 'STANDARD',
      conflictStrategy: data.conflictStrategy,
      createdAt: now,
      updatedAt: now,
      conditions: data.conditions.map((condition) => ({
        ruleConditionId: uuidv4(),
        ruleId,
        sourceType: condition.sourceType,
        field: condition.field,
        operator: condition.operator,
        value: condition.value ?? null,
        valueTo: condition.valueTo ?? null,
        valueList: condition.valueList ?? null,
        createdAt: now,
      })),
      levels: data.levels.map((level) => {
        const ruleLevelId = uuidv4();
        return {
          ruleLevelId,
          ruleId,
          levelNumber: level.levelNumber,
          mode: level.mode,
          createdAt: now,
          approvers: level.approverUserIds.map((userId) => ({
            ruleLevelId,
            userId,
            createdAt: now,
            user: createStubUser(userId),
          })),
        };
      }),
    };

    this.rules.push(rule);

    return Promise.resolve(rule);
  }

  findById(ruleId: string): Promise<RuleWithRelations | null> {
    return Promise.resolve(
      this.rules.find((rule) => rule.ruleId === ruleId) ?? null,
    );
  }

  findByCode(code: string): Promise<RuleWithRelations | null> {
    return Promise.resolve(
      this.rules.find((rule) => rule.code === code) ?? null,
    );
  }

  findAll(filter?: {
    companyId?: string;
    companyIds?: string[];
  }): Promise<RuleWithRelations[]> {
    const rules = filter?.companyId
      ? this.rules.filter((rule) => rule.companyId === filter.companyId)
      : filter?.companyIds
        ? this.rules.filter((rule) =>
            filter.companyIds!.includes(rule.companyId),
          )
        : this.rules;

    return Promise.resolve([...rules].sort((a, b) => a.priority - b.priority));
  }

  findActiveCandidates(
    companyId: string,
    now: Date,
  ): Promise<RuleWithRelations[]> {
    return Promise.resolve(
      this.rules
        .filter(
          (rule) =>
            rule.companyId === companyId &&
            rule.status === 'ACTIVE' &&
            rule.validFrom <= now &&
            (!rule.validTo || rule.validTo >= now),
        )
        .sort((a, b) => a.priority - b.priority),
    );
  }

  update(
    ruleId: string,
    data: UpdateRuleDto,
  ): Promise<RuleWithRelations | null> {
    const index = this.rules.findIndex((rule) => rule.ruleId === ruleId);

    if (index === -1) {
      return Promise.resolve(null);
    }

    const existing = this.rules[index];

    if (data.code && data.code !== existing.code) {
      const duplicated = this.rules.find(
        (rule) => rule.ruleId !== ruleId && rule.code === data.code,
      );

      if (duplicated) {
        throw new Error('Unique constraint violation');
      }
    }

    const now = new Date();

    const updated: RuleWithRelations = {
      ...existing,
      code: data.code ?? existing.code,
      name: data.name ?? existing.name,
      description:
        data.description !== undefined
          ? (data.description ?? null)
          : existing.description,
      companyId: data.companyId ?? existing.companyId,
      priority: data.priority ?? existing.priority,
      validFrom: data.validFrom ? new Date(data.validFrom) : existing.validFrom,
      validTo:
        data.validTo !== undefined
          ? data.validTo
            ? new Date(data.validTo)
            : null
          : existing.validTo,
      status: data.status ?? existing.status,
      ruleType: data.ruleType ?? existing.ruleType,
      conflictStrategy: data.conflictStrategy ?? existing.conflictStrategy,
      updatedAt: now,
      conditions: data.conditions
        ? data.conditions.map((condition) => ({
            ruleConditionId: uuidv4(),
            ruleId,
            sourceType: condition.sourceType,
            field: condition.field,
            operator: condition.operator,
            value: condition.value ?? null,
            valueTo: condition.valueTo ?? null,
            valueList: condition.valueList ?? null,
            createdAt: now,
          }))
        : existing.conditions,
      levels: data.levels
        ? data.levels.map((level) => {
            const ruleLevelId = uuidv4();
            return {
              ruleLevelId,
              ruleId,
              levelNumber: level.levelNumber,
              mode: level.mode,
              createdAt: now,
              approvers: level.approverUserIds.map((userId) => ({
                ruleLevelId,
                userId,
                createdAt: now,
                user: createStubUser(userId),
              })),
            };
          })
        : existing.levels,
    };

    this.rules[index] = updated;

    return Promise.resolve(updated);
  }
}
