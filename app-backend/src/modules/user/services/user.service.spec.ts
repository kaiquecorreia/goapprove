import { ForbiddenException } from '@nestjs/common';

import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { CompanyAccessService } from '../../company/services/company-access.service';
import {
  UserRepository,
  UserWithRelations,
} from '../repositories/user.repository';
import { UserService } from './user.service';

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

function buildUser(
  overrides: Partial<UserWithRelations> = {},
): UserWithRelations {
  return {
    userId: 'target-1',
    name: 'Target',
    email: 'target@x.com',
    externalIntegrationUser: null,
    role: 'APPROVER',
    active: true,
    approvalLimit: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    companies: [
      {
        companyId: 'company-A',
        userId: 'target-1',
        isDefault: false,
        createdAt: new Date(),
      },
    ] as never,
    substitutes: [],
    substitutedBy: [],
    ...overrides,
  };
}

describe('UserService', () => {
  let userRepository: jest.Mocked<
    Pick<
      UserRepository,
      'create' | 'findById' | 'findAll' | 'update' | 'updatePasswordHash'
    >
  >;
  let transactionService: { run: jest.Mock };
  let passwordService: { hash: jest.Mock };
  let companyAccessService: jest.Mocked<
    Pick<
      CompanyAccessService,
      'getAccessibleCompanyIds' | 'assertCompanyAccess'
    >
  >;
  let service: UserService;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    transactionService = { run: jest.fn((fn: () => Promise<unknown>) => fn()) };
    passwordService = { hash: jest.fn().mockResolvedValue('hashed') };
    companyAccessService = {
      getAccessibleCompanyIds: jest.fn(),
      assertCompanyAccess: jest.fn().mockResolvedValue(undefined),
    };

    service = new UserService(
      userRepository as unknown as UserRepository,
      transactionService as never,
      passwordService as never,
      companyAccessService as unknown as CompanyAccessService,
    );
  });

  describe('create (bootstrap, unauthenticated)', () => {
    it('cria o usuário do onboarding sem exigir companyIds nem actingUser', async () => {
      userRepository.create.mockResolvedValue(buildUser());

      await expect(
        service.create({
          name: 'Owner',
          email: 'owner@x.com',
          password: 'password123',
          role: 'OWNER',
        }),
      ).resolves.toBeDefined();

      expect(companyAccessService.assertCompanyAccess).not.toHaveBeenCalled();
    });
  });

  describe('createAuthorized', () => {
    it('OWNER cria usuário dentro da própria empresa: ok', async () => {
      userRepository.create.mockResolvedValue(buildUser());

      await service.createAuthorized(
        {
          name: 'New',
          email: 'new@x.com',
          password: 'password123',
          role: 'APPROVER',
          companyIds: ['company-A'],
        },
        OWNER_A,
      );

      expect(companyAccessService.assertCompanyAccess).toHaveBeenCalledWith(
        OWNER_A,
        ['company-A'],
        'all',
      );
    });

    it('OWNER tentando incluir uma empresa alheia em companyIds: 403 (mode all)', async () => {
      companyAccessService.assertCompanyAccess.mockRejectedValue(
        new ForbiddenException('You do not have access to this resource'),
      );

      await expect(
        service.createAuthorized(
          {
            name: 'New',
            email: 'new@x.com',
            password: 'password123',
            role: 'APPROVER',
            companyIds: ['company-A', 'company-B'],
          },
          OWNER_A,
        ),
      ).rejects.toThrow('You do not have access to this resource');
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('não-admin tentando criar um usuário ADMINISTRATOR: 403, mesmo com companyIds válidos', async () => {
      await expect(
        service.createAuthorized(
          {
            name: 'New Admin',
            email: 'newadmin@x.com',
            password: 'password123',
            role: 'ADMINISTRATOR',
          },
          OWNER_A,
        ),
      ).rejects.toThrow('Only an ADMINISTRATOR can manage ADMINISTRATOR users');
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('ADMINISTRATOR pode criar um usuário ADMINISTRATOR', async () => {
      userRepository.create.mockResolvedValue(
        buildUser({ role: 'ADMINISTRATOR' as never }),
      );

      await expect(
        service.createAuthorized(
          {
            name: 'New Admin',
            email: 'newadmin@x.com',
            password: 'password123',
            role: 'ADMINISTRATOR',
          },
          ADMIN,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('findById', () => {
    it('OWNER lendo um usuário da própria empresa: ok', async () => {
      userRepository.findById.mockResolvedValue(buildUser());

      await expect(
        service.findById('target-1', OWNER_A),
      ).resolves.toBeDefined();
      expect(companyAccessService.assertCompanyAccess).toHaveBeenCalledWith(
        OWNER_A,
        ['company-A'],
      );
    });

    it('OWNER lendo um usuário ADMINISTRATOR: 403, independente da empresa', async () => {
      userRepository.findById.mockResolvedValue(
        buildUser({ role: 'ADMINISTRATOR' as never, companies: [] as never }),
      );

      await expect(service.findById('target-1', OWNER_A)).rejects.toThrow(
        'Only an ADMINISTRATOR can manage ADMINISTRATOR users',
      );
    });

    it('OWNER lendo um usuário de empresa alheia: 403', async () => {
      userRepository.findById.mockResolvedValue(buildUser());
      companyAccessService.assertCompanyAccess.mockRejectedValue(
        new ForbiddenException('You do not have access to this resource'),
      );

      await expect(service.findById('target-1', OWNER_A)).rejects.toThrow(
        'You do not have access to this resource',
      );
    });
  });

  describe('findAll', () => {
    it('filtra pelas empresas acessíveis do ator quando não é ADMINISTRATOR', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue([
        'company-A',
      ]);
      userRepository.findAll.mockResolvedValue([]);

      await service.findAll(OWNER_A);

      expect(userRepository.findAll).toHaveBeenCalledWith(['company-A']);
    });

    it('não filtra para ADMINISTRATOR', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue(null);
      userRepository.findAll.mockResolvedValue([]);

      await service.findAll(ADMIN);

      expect(userRepository.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('update', () => {
    it('OWNER tentando editar um usuário ADMINISTRATOR: 403', async () => {
      userRepository.findById.mockResolvedValue(
        buildUser({ role: 'ADMINISTRATOR' as never, companies: [] as never }),
      );

      await expect(
        service.update('target-1', { name: 'Renamed' }, OWNER_A),
      ).rejects.toThrow('Only an ADMINISTRATOR can manage ADMINISTRATOR users');
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('OWNER tentando promover um alvo para ADMINISTRATOR: 403', async () => {
      userRepository.findById.mockResolvedValue(buildUser());

      await expect(
        service.update('target-1', { role: 'ADMINISTRATOR' }, OWNER_A),
      ).rejects.toThrow('Only an ADMINISTRATOR can manage ADMINISTRATOR users');
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('setPassword', () => {
    it('OWNER tentando trocar a senha de um usuário ADMINISTRATOR: 403', async () => {
      userRepository.findById.mockResolvedValue(
        buildUser({ role: 'ADMINISTRATOR' as never, companies: [] as never }),
      );

      await expect(
        service.setPassword('target-1', 'newpassword123', OWNER_A),
      ).rejects.toThrow('Only an ADMINISTRATOR can manage ADMINISTRATOR users');
      expect(userRepository.updatePasswordHash).not.toHaveBeenCalled();
    });

    it('OWNER trocando a senha de um usuário da própria empresa: ok', async () => {
      userRepository.findById.mockResolvedValue(buildUser());
      userRepository.updatePasswordHash.mockResolvedValue(buildUser());

      await expect(
        service.setPassword('target-1', 'newpassword123', OWNER_A),
      ).resolves.toBeDefined();
    });
  });
});
