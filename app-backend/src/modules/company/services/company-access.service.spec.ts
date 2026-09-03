import { CompanyUser } from '@prisma/client';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CompanyAccessService } from './company-access.service';
import { CompanyUserRepository } from '../repositories/company-user.repository';

function buildCompanyUser(companyId: string): CompanyUser {
  return {
    companyId,
    userId: 'user-1',
    isDefault: false,
    createdAt: new Date(),
  };
}

const ADMIN: AuthenticatedUser = {
  userId: 'admin-1',
  role: 'ADMINISTRATOR',
  email: 'admin@x.com',
};

const OWNER: AuthenticatedUser = {
  userId: 'owner-1',
  role: 'OWNER',
  email: 'owner@x.com',
};

describe('CompanyAccessService', () => {
  let companyUserRepository: jest.Mocked<
    Pick<CompanyUserRepository, 'findByUserId'>
  >;
  let service: CompanyAccessService;

  beforeEach(() => {
    companyUserRepository = { findByUserId: jest.fn() };
    service = new CompanyAccessService(
      companyUserRepository as unknown as CompanyUserRepository,
    );
  });

  describe('getAccessibleCompanyIds', () => {
    it('retorna null para ADMINISTRATOR sem consultar o banco', async () => {
      const result = await service.getAccessibleCompanyIds(ADMIN);

      expect(result).toBeNull();
      expect(companyUserRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('retorna as empresas reais do usuário para não-admin, buscando no banco', async () => {
      companyUserRepository.findByUserId.mockResolvedValue([
        buildCompanyUser('company-1'),
        buildCompanyUser('company-2'),
      ]);

      const result = await service.getAccessibleCompanyIds(OWNER);

      expect(result).toEqual(['company-1', 'company-2']);
      expect(companyUserRepository.findByUserId).toHaveBeenCalledWith(
        'owner-1',
      );
    });
  });

  describe('assertCompanyAccess', () => {
    it('mode any: ADMINISTRATOR sempre passa, mesmo com lista vazia', async () => {
      await expect(
        service.assertCompanyAccess(ADMIN, []),
      ).resolves.toBeUndefined();
    });

    it('mode any: passa com overlap parcial', async () => {
      companyUserRepository.findByUserId.mockResolvedValue([
        buildCompanyUser('company-1'),
      ]);

      await expect(
        service.assertCompanyAccess(OWNER, ['company-1', 'company-2']),
      ).resolves.toBeUndefined();
    });

    it('mode any: lança Forbidden sem nenhum overlap', async () => {
      companyUserRepository.findByUserId.mockResolvedValue([
        buildCompanyUser('company-1'),
      ]);

      await expect(
        service.assertCompanyAccess(OWNER, ['company-2']),
      ).rejects.toThrow('You do not have access to this resource');
    });

    it('mode all: lança Forbidden se apenas uma empresa do alvo estiver fora do conjunto do ator', async () => {
      companyUserRepository.findByUserId.mockResolvedValue([
        buildCompanyUser('company-1'),
      ]);

      await expect(
        service.assertCompanyAccess(OWNER, ['company-1', 'company-2'], 'all'),
      ).rejects.toThrow('You do not have access to this resource');
    });

    it('mode all: passa apenas quando todas as empresas do alvo estão no conjunto do ator', async () => {
      companyUserRepository.findByUserId.mockResolvedValue([
        buildCompanyUser('company-1'),
        buildCompanyUser('company-2'),
      ]);

      await expect(
        service.assertCompanyAccess(OWNER, ['company-1', 'company-2'], 'all'),
      ).resolves.toBeUndefined();
    });

    it('mode all: lança Forbidden para lista de alvo vazia (não-admin)', async () => {
      companyUserRepository.findByUserId.mockResolvedValue([
        buildCompanyUser('company-1'),
      ]);

      await expect(
        service.assertCompanyAccess(OWNER, [], 'all'),
      ).rejects.toThrow('You do not have access to this resource');
    });
  });
});
