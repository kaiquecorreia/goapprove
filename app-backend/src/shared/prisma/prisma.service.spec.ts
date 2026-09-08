import { ClsService } from './cls.service';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(),
  })),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

describe('PrismaService', () => {
  let service: PrismaService;
  let clsService: ClsService;

  beforeEach(() => {
    clsService = new ClsService();
    service = new PrismaService(clsService);
  });

  describe('getClient()', () => {
    it('retorna o cliente Prisma padrão quando não há transação no contexto', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
    });

    it('retorna o cliente transacional quando há transação no contexto', () => {
      const fakeTransaction = {
        isTransaction: true,
      } as unknown as Prisma.TransactionClient;
      clsService.prismaTransaction.run(fakeTransaction, () => {
        const client = service.getClient();
        expect(client).toBe(fakeTransaction);
      });
    });
  });

  describe('getRootClient()', () => {
    it('ignora a transação do contexto e retorna sempre o cliente raiz', () => {
      const rootClient = service.getRootClient();
      const fakeTransaction = {
        isTransaction: true,
      } as unknown as Prisma.TransactionClient;

      clsService.prismaTransaction.run(fakeTransaction, () => {
        expect(service.getClient()).toBe(fakeTransaction);
        expect(service.getRootClient()).toBe(rootClient);
      });
    });
  });

  describe('onModuleDestroy()', () => {
    it('chama $disconnect e pool.end', async () => {
      const serviceAccess = service as unknown as {
        prisma: {
          $disconnect: jest.MockedFunction<() => Promise<void>>;
        };
        pool: {
          end: jest.MockedFunction<() => Promise<void>>;
        };
      };
      const prismaInstance = serviceAccess.prisma;
      const poolInstance = serviceAccess.pool;
      await service.onModuleDestroy();
      expect(prismaInstance.$disconnect).toHaveBeenCalled();
      expect(poolInstance.end).toHaveBeenCalled();
    });
  });

  describe('runInTransaction()', () => {
    it('chama $transaction no prisma e executa o callback', async () => {
      const serviceAccess = service as unknown as {
        prisma: {
          $transaction: jest.MockedFunction<
            (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>
          >;
        };
      };
      const prismaInstance = serviceAccess.prisma;
      const fakeResult = { done: true };
      prismaInstance.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({ txClient: true });
        },
      );
      const fn = jest.fn().mockResolvedValue(fakeResult);
      const result = await service.runInTransaction(fn);
      expect(fn).toHaveBeenCalled();
      expect(result).toEqual(fakeResult);
    });

    it('executa os hooks registrados somente após o commit', async () => {
      mockTransaction(service);

      const order: string[] = [];
      const hook = jest.fn(() => order.push('hook'));

      await service.runInTransaction(() => {
        clsService.transactionHooks.getStore()?.push(hook);
        order.push('work');
        return Promise.resolve(null);
      });

      expect(hook).toHaveBeenCalledTimes(1);
      expect(order).toEqual(['work', 'hook']);
    });

    it('não executa os hooks quando a transação falha', async () => {
      mockTransaction(service);

      const hook = jest.fn();

      await expect(
        service.runInTransaction(() => {
          clsService.transactionHooks.getStore()?.push(hook);
          throw new Error('rollback');
        }),
      ).rejects.toThrow('rollback');

      expect(hook).not.toHaveBeenCalled();
    });

    it('não deixa a falha de um hook interromper os demais', async () => {
      mockTransaction(service);

      const failing = jest.fn(() => {
        throw new Error('hook failed');
      });
      const following = jest.fn();

      await expect(
        service.runInTransaction(() => {
          const hooks = clsService.transactionHooks.getStore();
          hooks?.push(failing, following);
          return Promise.resolve(null);
        }),
      ).resolves.toBeNull();

      expect(failing).toHaveBeenCalled();
      expect(following).toHaveBeenCalled();
    });
  });
});

function mockTransaction(service: PrismaService): void {
  const serviceAccess = service as unknown as {
    prisma: {
      $transaction: jest.MockedFunction<
        (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>
      >;
    };
  };

  serviceAccess.prisma.$transaction.mockImplementation(
    async (fn: (tx: unknown) => Promise<unknown>) => fn({ txClient: true }),
  );
}
