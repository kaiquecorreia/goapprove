import { ForbiddenException } from '@nestjs/common';

import { CompanyAccessService } from '../../company/services/company-access.service';
import { AuthenticatedUser } from '../../../shared/types/authenticated-user';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { DashboardService } from './dashboard.service';

const ADMIN_USER: AuthenticatedUser = {
  userId: 'admin-1',
  role: 'ADMINISTRATOR',
  email: 'admin@x.com',
};

const OWNER_USER: AuthenticatedUser = {
  userId: 'owner-1',
  role: 'OWNER',
  email: 'owner@x.com',
};

describe('DashboardService', () => {
  let dashboardRepository: jest.Mocked<DashboardRepository>;
  let companyAccessService: jest.Mocked<
    Pick<CompanyAccessService, 'getAccessibleCompanyIds'>
  >;
  let service: DashboardService;

  beforeEach(() => {
    dashboardRepository = {
      countByStatus: jest.fn().mockResolvedValue([]),
      findMonthlyTrend: jest.fn().mockResolvedValue([]),
      findCompanyDistribution: jest.fn().mockResolvedValue([]),
      findRecentActivity: jest.fn().mockResolvedValue([]),
    };

    companyAccessService = {
      getAccessibleCompanyIds: jest.fn(),
    };

    service = new DashboardService(
      dashboardRepository,
      companyAccessService as unknown as CompanyAccessService,
    );
  });

  describe('escopo por empresa', () => {
    it('ADMINISTRATOR sem companyId: consulta irrestrita (sem companyIds)', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue(null);

      await service.getKpis(ADMIN_USER, {});

      const criteria = dashboardRepository.countByStatus.mock.calls[0][0];
      expect(criteria.companyId).toBeUndefined();
      expect(criteria.companyIds).toBeUndefined();
    });

    it('OWNER sem companyId: restringe às próprias empresas (evita vazamento entre empresas)', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue([
        'company-1',
        'company-2',
      ]);

      await service.getKpis(OWNER_USER, {});

      const criteria = dashboardRepository.countByStatus.mock.calls[0][0];
      expect(criteria.companyIds).toEqual(['company-1', 'company-2']);
    });

    it('OWNER com companyId fora do escopo: lança ForbiddenException', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue([
        'company-1',
      ]);

      await expect(
        service.getKpis(OWNER_USER, { companyId: 'company-9' }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(dashboardRepository.countByStatus).not.toHaveBeenCalled();
    });

    it('OWNER com companyId dentro do escopo: restringe àquela empresa', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue([
        'company-1',
        'company-2',
      ]);

      await service.getKpis(OWNER_USER, { companyId: 'company-2' });

      const criteria = dashboardRepository.countByStatus.mock.calls[0][0];
      expect(criteria.companyIds).toEqual(['company-2']);
    });

    it('usuário sem nenhuma empresa vinculada: retorna zerado sem consultar o banco', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue([]);

      const kpis = await service.getKpis(OWNER_USER, {});
      const trend = await service.getMonthlyTrend(OWNER_USER, {});
      const distribution = await service.getCompanyDistribution(OWNER_USER, {});
      const recent = await service.getRecentActivity(OWNER_USER, {});

      expect(kpis.totalCount).toBe(0);
      expect(trend).toEqual([]);
      expect(distribution).toEqual([]);
      expect(recent).toEqual([]);
      expect(dashboardRepository.countByStatus).not.toHaveBeenCalled();
      expect(dashboardRepository.findMonthlyTrend).not.toHaveBeenCalled();
    });
  });

  describe('getKpis', () => {
    beforeEach(() => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue(null);
    });

    it('pivota os buckets e zera os status ausentes', async () => {
      dashboardRepository.countByStatus.mockResolvedValue([
        { status: 'PENDING', count: 3, amount: '1000.50' },
        { status: 'APPROVED', count: 7, amount: '2500.25' },
      ]);

      const kpis = await service.getKpis(ADMIN_USER, {});

      expect(kpis).toEqual({
        pending: 3,
        approved: 7,
        rejected: 0,
        cancelled: 0,
        noRule: 0,
        error: 0,
        totalCount: 10,
        totalAmount: '3500.75',
      });
    });

    it('soma o valor total de todos os status, não só dos aprovados', async () => {
      dashboardRepository.countByStatus.mockResolvedValue([
        { status: 'APPROVED', count: 1, amount: '0.10' },
        { status: 'REJECTED', count: 1, amount: '0.20' },
      ]);

      const kpis = await service.getKpis(ADMIN_USER, {});

      // Somar 0.10 + 0.20 em ponto flutuante daria 0.30000000000000004.
      expect(kpis.totalAmount).toBe('0.30');
    });
  });

  describe('período', () => {
    beforeEach(() => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue(null);
    });

    it('sem datas: usa os últimos 6 meses a partir do início do mês', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-08T12:00:00.000Z'));

      await service.getKpis(ADMIN_USER, {});

      const criteria = dashboardRepository.countByStatus.mock.calls[0][0];
      expect(criteria.dateFrom.toISOString()).toBe('2026-04-01T00:00:00.000Z');
      expect(criteria.dateTo.toISOString()).toBe('2026-09-08T12:00:00.000Z');

      jest.useRealTimers();
    });

    it('months customizado só afeta a tendência mensal', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-08T12:00:00.000Z'));

      await service.getMonthlyTrend(ADMIN_USER, { months: 3 });

      const criteria = dashboardRepository.findMonthlyTrend.mock.calls[0][0];
      expect(criteria.dateFrom.toISOString()).toBe('2026-07-01T00:00:00.000Z');

      jest.useRealTimers();
    });

    it('datas explícitas têm precedência sobre a janela padrão', async () => {
      await service.getKpis(ADMIN_USER, {
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-01-31T23:59:59.999Z',
      });

      const criteria = dashboardRepository.countByStatus.mock.calls[0][0];
      expect(criteria.dateFrom.toISOString()).toBe('2026-01-01T00:00:00.000Z');
      expect(criteria.dateTo.toISOString()).toBe('2026-01-31T23:59:59.999Z');
    });
  });

  describe('getCompanyDistribution', () => {
    beforeEach(() => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue(null);
    });

    it('agrega o restante em "Outras" quando há mais empresas que o limite', async () => {
      dashboardRepository.findCompanyDistribution.mockResolvedValue([
        { companyId: 'c1', name: 'Norte', count: 10, amount: '1000.00' },
        { companyId: 'c2', name: 'Sul', count: 6, amount: '600.00' },
        { companyId: 'c3', name: 'Leste', count: 4, amount: '400.00' },
      ]);
      dashboardRepository.countByStatus.mockResolvedValue([
        { status: 'APPROVED', count: 25, amount: '2500.00' },
      ]);

      const distribution = await service.getCompanyDistribution(ADMIN_USER, {
        limit: 4,
      });

      // Só (limit - 1) empresas são listadas; a última fatia é o restante.
      expect(
        dashboardRepository.findCompanyDistribution.mock.calls[0][0].take,
      ).toBe(3);
      expect(distribution).toHaveLength(4);
      expect(distribution[3]).toEqual({
        companyId: null,
        name: 'Outras',
        count: 5,
        amount: '500.00',
      });
    });

    it('não adiciona "Outras" quando as empresas listadas já cobrem o total', async () => {
      dashboardRepository.findCompanyDistribution.mockResolvedValue([
        { companyId: 'c1', name: 'Norte', count: 10, amount: '1000.00' },
      ]);
      dashboardRepository.countByStatus.mockResolvedValue([
        { status: 'APPROVED', count: 10, amount: '1000.00' },
      ]);

      const distribution = await service.getCompanyDistribution(ADMIN_USER, {
        limit: 4,
      });

      expect(distribution).toHaveLength(1);
      expect(distribution[0].name).toBe('Norte');
    });
  });

  describe('getRecentActivity', () => {
    it('repassa o limite ao repositório', async () => {
      companyAccessService.getAccessibleCompanyIds.mockResolvedValue(null);

      await service.getRecentActivity(ADMIN_USER, { limit: 10 });

      expect(dashboardRepository.findRecentActivity.mock.calls[0][0].take).toBe(
        10,
      );
    });
  });
});
