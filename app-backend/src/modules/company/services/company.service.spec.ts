import { ForbiddenException } from '@nestjs/common';
import { Company } from '@prisma/client';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CompanyRepository } from '../repositories/company.repository';
import { CompanyAccessService } from './company-access.service';
import { CompanyService } from './company.service';

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

function buildCompany(overrides: Partial<Company> = {}): Company {
  return {
    companyId: 'company-A',
    externalIntegrationCode: 'CODE-1',
    name: 'Company A',
    environment: 'DEVELOPMENT',
    cnpj: null,
    status: true,
    externalIntegrationUrlBase: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('CompanyService', () => {
  let companyRepository: jest.Mocked<
    Pick<CompanyRepository, 'findById' | 'findAll' | 'update'>
  >;
  let transactionService: { run: jest.Mock };
  let companyAccessService: jest.Mocked<
    Pick<
      CompanyAccessService,
      'getAccessibleCompanyIds' | 'assertCompanyAccess'
    >
  >;
  let service: CompanyService;

  beforeEach(() => {
    companyRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };
    transactionService = { run: jest.fn((fn: () => Promise<unknown>) => fn()) };
    companyAccessService = {
      getAccessibleCompanyIds: jest.fn(),
      assertCompanyAccess: jest.fn().mockResolvedValue(undefined),
    };

    service = new CompanyService(
      companyRepository as unknown as CompanyRepository,
      transactionService as never,
      companyAccessService as unknown as CompanyAccessService,
    );
  });

  describe('findById', () => {
    it('OWNER lendo a própria empresa: ok', async () => {
      companyRepository.findById.mockResolvedValue(buildCompany());

      await expect(
        service.findById('company-A', OWNER_A),
      ).resolves.toBeDefined();
      expect(companyAccessService.assertCompanyAccess).toHaveBeenCalledWith(
        OWNER_A,
        ['company-A'],
      );
    });

    it('OWNER lendo empresa alheia: 403', async () => {
      companyRepository.findById.mockResolvedValue(
        buildCompany({ companyId: 'company-B' }),
      );
      companyAccessService.assertCompanyAccess.mockRejectedValue(
        new ForbiddenException('You do not have access to this resource'),
      );

      await expect(service.findById('company-B', OWNER_A)).rejects.toThrow(
        'You do not have access to this resource',
      );
    });
  });

  describe('findAll', () => {
    it('filtra pelas empresas acessíveis para não-admin', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue([
        'company-A',
      ]);
      companyRepository.findAll.mockResolvedValue([]);

      await service.findAll(OWNER_A);

      expect(companyRepository.findAll).toHaveBeenCalledWith(['company-A']);
    });

    it('não filtra para ADMINISTRATOR', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue(null);
      companyRepository.findAll.mockResolvedValue([]);

      await service.findAll(ADMIN);

      expect(companyRepository.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('update', () => {
    it('OWNER atualizando empresa alheia: 403, sem persistir', async () => {
      companyAccessService.assertCompanyAccess.mockRejectedValue(
        new ForbiddenException('You do not have access to this resource'),
      );

      await expect(
        service.update('company-B', { name: 'New name' }, OWNER_A),
      ).rejects.toThrow('You do not have access to this resource');
      expect(companyRepository.update).not.toHaveBeenCalled();
    });

    it('OWNER atualizando a própria empresa: ok', async () => {
      companyRepository.update.mockResolvedValue(buildCompany());

      await expect(
        service.update('company-A', { name: 'New name' }, OWNER_A),
      ).resolves.toBeDefined();
    });
  });
});
