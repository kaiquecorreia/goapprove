import { ForbiddenException } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CompanyAccessService } from '../../company/services/company-access.service';
import { CompanyUserRepository } from '../../company/repositories/company-user.repository';
import { UserRepository } from '../../user/repositories/user.repository';
import { RuleRepository } from '../repositories/rule.repository';
import { RuleWithRelations } from '../types/rule-with-relations';
import { RuleService } from './rule.service';

const OWNER_A: AuthenticatedUser = {
  userId: 'owner-a',
  role: 'OWNER',
  email: 'owner-a@x.com',
};

const ADMIN: AuthenticatedUser = {
  userId: 'admin-1',
  role: 'ADMINISTRATOR',
  email: 'admin@x.com',
};

function buildRule(
  overrides: Partial<RuleWithRelations> = {},
): RuleWithRelations {
  return {
    ruleId: 'rule-1',
    code: 'R1',
    name: 'Rule 1',
    description: null,
    companyId: 'company-A',
    priority: 1,
    validFrom: new Date(),
    validTo: null,
    status: 'ACTIVE',
    ruleType: 'STANDARD',
    conflictStrategy: 'MOST_RESTRICTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    conditions: [],
    levels: [],
    ...overrides,
  };
}

describe('RuleService', () => {
  let ruleRepository: jest.Mocked<
    Pick<RuleRepository, 'create' | 'findById' | 'findAll' | 'update'>
  >;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById'>>;
  let companyUserRepository: jest.Mocked<
    Pick<CompanyUserRepository, 'findByCompanyId'>
  >;
  let transactionService: { run: jest.Mock };
  let companyAccessService: jest.Mocked<
    Pick<
      CompanyAccessService,
      'getAccessibleCompanyIds' | 'assertCompanyAccess'
    >
  >;
  let service: RuleService;

  beforeEach(() => {
    ruleRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };
    userRepository = { findById: jest.fn() };
    companyUserRepository = {
      findByCompanyId: jest.fn().mockResolvedValue([]),
    };
    transactionService = { run: jest.fn((fn: () => Promise<unknown>) => fn()) };
    companyAccessService = {
      getAccessibleCompanyIds: jest.fn(),
      assertCompanyAccess: jest.fn().mockResolvedValue(undefined),
    };

    service = new RuleService(
      ruleRepository as unknown as RuleRepository,
      userRepository as unknown as UserRepository,
      companyUserRepository as unknown as CompanyUserRepository,
      transactionService as never,
      companyAccessService as unknown as CompanyAccessService,
    );
  });

  describe('create', () => {
    it('OWNER criando regra fora da própria empresa: 403', async () => {
      companyAccessService.assertCompanyAccess.mockRejectedValue(
        new ForbiddenException('You do not have access to this resource'),
      );

      await expect(
        service.create(
          {
            code: 'R2',
            name: 'Rule 2',
            companyId: 'company-B',
            priority: 1,
            validFrom: new Date().toISOString(),
            conflictStrategy: 'MOST_RESTRICTIVE',
            conditions: [],
            levels: [],
          },
          OWNER_A,
        ),
      ).rejects.toThrow('You do not have access to this resource');
      expect(ruleRepository.create).not.toHaveBeenCalled();
    });

    it('rejeita regra AUTO_APPROVE com níveis informados', async () => {
      await expect(
        service.create(
          {
            code: 'R-AUTO',
            name: 'Auto rule',
            companyId: 'company-A',
            priority: 1,
            validFrom: new Date().toISOString(),
            conflictStrategy: 'MOST_RESTRICTIVE',
            ruleType: 'AUTO_APPROVE',
            conditions: [],
            levels: [{ levelNumber: 1, mode: 'ANY', approverUserIds: ['u1'] }],
          },
          OWNER_A,
        ),
      ).rejects.toThrow('AUTO_APPROVE rules cannot have approval levels');
      expect(ruleRepository.create).not.toHaveBeenCalled();
    });

    it('rejeita regra STANDARD (ou sem ruleType) sem nenhum nível', async () => {
      await expect(
        service.create(
          {
            code: 'R-STD',
            name: 'Standard rule',
            companyId: 'company-A',
            priority: 1,
            validFrom: new Date().toISOString(),
            conflictStrategy: 'MOST_RESTRICTIVE',
            conditions: [],
            levels: [],
          },
          OWNER_A,
        ),
      ).rejects.toThrow('STANDARD rules require at least one approval level');
      expect(ruleRepository.create).not.toHaveBeenCalled();
    });

    it('aceita regra AUTO_APPROVE sem níveis e pula a validação de aprovadores', async () => {
      ruleRepository.create.mockResolvedValue(buildRule({ ruleType: 'AUTO_APPROVE' }));

      await service.create(
        {
          code: 'R-AUTO',
          name: 'Auto rule',
          companyId: 'company-A',
          priority: 1,
          validFrom: new Date().toISOString(),
          conflictStrategy: 'MOST_RESTRICTIVE',
          ruleType: 'AUTO_APPROVE',
          conditions: [],
          levels: [],
        },
        OWNER_A,
      );

      expect(ruleRepository.create).toHaveBeenCalled();
      expect(companyUserRepository.findByCompanyId).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('OWNER lendo regra de empresa alheia: 403', async () => {
      ruleRepository.findById.mockResolvedValue(
        buildRule({ companyId: 'company-B' }),
      );
      companyAccessService.assertCompanyAccess.mockRejectedValue(
        new ForbiddenException('You do not have access to this resource'),
      );

      await expect(service.findById('rule-1', OWNER_A)).rejects.toThrow(
        'You do not have access to this resource',
      );
    });
  });

  describe('findAll', () => {
    it('sem companyId, não-admin: escopado às próprias empresas', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue([
        'company-A',
      ]);
      ruleRepository.findAll.mockResolvedValue([]);

      await service.findAll(undefined, OWNER_A);

      expect(ruleRepository.findAll).toHaveBeenCalledWith({
        companyIds: ['company-A'],
      });
    });

    it('com companyId fora do conjunto do ator: 403', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue([
        'company-A',
      ]);
      companyAccessService.assertCompanyAccess.mockRejectedValue(
        new ForbiddenException('You do not have access to this resource'),
      );

      await expect(service.findAll('company-B', OWNER_A)).rejects.toThrow(
        'You do not have access to this resource',
      );
      expect(ruleRepository.findAll).not.toHaveBeenCalled();
    });

    it('ADMINISTRATOR: sem escopo, companyId repassado como está', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue(null);
      ruleRepository.findAll.mockResolvedValue([]);

      await service.findAll('company-B', ADMIN);

      expect(ruleRepository.findAll).toHaveBeenCalledWith({
        companyId: 'company-B',
      });
    });
  });

  describe('update', () => {
    it('movendo companyId para uma empresa alheia: 403', async () => {
      ruleRepository.findById.mockResolvedValue(buildRule());
      companyAccessService.assertCompanyAccess
        .mockResolvedValueOnce(undefined) // check on existing companyId
        .mockRejectedValueOnce(
          new ForbiddenException('You do not have access to this resource'),
        );

      await expect(
        service.update('rule-1', { companyId: 'company-B' }, OWNER_A),
      ).rejects.toThrow('You do not have access to this resource');
      expect(ruleRepository.update).not.toHaveBeenCalled();
    });

    it('rejeita mudar para AUTO_APPROVE mantendo os níveis existentes', async () => {
      ruleRepository.findById.mockResolvedValue(
        buildRule({
          levels: [
            {
              ruleLevelId: 'level-1',
              ruleId: 'rule-1',
              levelNumber: 1,
              mode: 'ANY',
              createdAt: new Date(),
              approvers: [],
            },
          ],
        }),
      );

      await expect(
        service.update('rule-1', { ruleType: 'AUTO_APPROVE' }, OWNER_A),
      ).rejects.toThrow('AUTO_APPROVE rules cannot have approval levels');
      expect(ruleRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('setStatus / delete', () => {
    it('OWNER desativando regra de empresa alheia: 403', async () => {
      ruleRepository.findById.mockResolvedValue(
        buildRule({ companyId: 'company-B' }),
      );
      companyAccessService.assertCompanyAccess.mockRejectedValue(
        new ForbiddenException('You do not have access to this resource'),
      );

      await expect(service.delete('rule-1', OWNER_A)).rejects.toThrow(
        'You do not have access to this resource',
      );
      expect(ruleRepository.update).not.toHaveBeenCalled();
    });
  });
});
