import { ClsService } from './cls.service';
import { Prisma } from '@prisma/client';

describe('ClsService', () => {
  let service: ClsService;

  beforeEach(() => {
    service = new ClsService();
  });

  it('expõe prismaTransaction como AsyncLocalStorage', () => {
    expect(service.prismaTransaction).toBeDefined();
    expect(typeof service.prismaTransaction.run).toBe('function');
    expect(typeof service.prismaTransaction.getStore).toBe('function');
  });

  it('getStore() retorna undefined fora de contexto', () => {
    expect(service.prismaTransaction.getStore()).toBeUndefined();
  });

  it('getStore() retorna o valor armazenado dentro do contexto run()', (done) => {
    const fakeClient = {
      fake: true,
    } as unknown as Prisma.TransactionClient;
    service.prismaTransaction.run(fakeClient, () => {
      expect(service.prismaTransaction.getStore()).toBe(fakeClient);
      done();
    });
  });

  it('expõe transactionHooks como AsyncLocalStorage independente', () => {
    expect(service.transactionHooks).toBeDefined();
    expect(service.transactionHooks.getStore()).toBeUndefined();

    const hooks: Array<() => void> = [];
    service.transactionHooks.run(hooks, () => {
      expect(service.transactionHooks.getStore()).toBe(hooks);
      expect(service.prismaTransaction.getStore()).toBeUndefined();
    });
  });
});
