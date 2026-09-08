import { TransactionService } from './transaction.service';
import { PrismaService } from './prisma.service';
import { ClsService } from './cls.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaService: { runInTransaction: jest.Mock };
  let clsService: {
    prismaTransaction: { getStore: jest.Mock };
    transactionHooks: { getStore: jest.Mock };
  };

  beforeEach(() => {
    prismaService = { runInTransaction: jest.fn() };
    clsService = {
      prismaTransaction: { getStore: jest.fn() },
      transactionHooks: { getStore: jest.fn() },
    };
    service = new TransactionService(
      prismaService as unknown as PrismaService,
      clsService as unknown as ClsService,
    );
  });

  it('chama runInTransaction quando não há transação ativa no contexto', async () => {
    clsService.prismaTransaction.getStore.mockReturnValue(undefined);
    const fakeResult = { ok: true };
    prismaService.runInTransaction.mockResolvedValue(fakeResult);
    const fn = jest.fn().mockResolvedValue(fakeResult);
    const result = await service.run(fn);
    expect(prismaService.runInTransaction).toHaveBeenCalledWith(fn);
    expect(result).toEqual(fakeResult);
  });

  it('reutiliza transação existente e chama fn() diretamente', async () => {
    const existingTx = { tx: true };
    clsService.prismaTransaction.getStore.mockReturnValue(existingTx);
    const fakeResult = { reused: true };
    const fn = jest.fn().mockResolvedValue(fakeResult);
    const result = await service.run(fn);
    expect(prismaService.runInTransaction).not.toHaveBeenCalled();
    expect(fn).toHaveBeenCalled();
    expect(result).toEqual(fakeResult);
  });

  it('propaga o valor retornado pelo callback', async () => {
    clsService.prismaTransaction.getStore.mockReturnValue(undefined);
    const expected = 42;
    prismaService.runInTransaction.mockImplementation(
      (fn: () => Promise<number>) => fn(),
    );
    const fn = jest.fn().mockResolvedValue(expected);
    const result = await service.run(fn);
    expect(result).toBe(expected);
  });

  describe('isActive()', () => {
    it('reflete a presença de uma transação no contexto', () => {
      clsService.prismaTransaction.getStore.mockReturnValue(undefined);
      expect(service.isActive()).toBe(false);

      clsService.prismaTransaction.getStore.mockReturnValue({ tx: true });
      expect(service.isActive()).toBe(true);
    });
  });

  describe('onCommit()', () => {
    it('enfileira o callback quando há transação em andamento', () => {
      const hooks: Array<() => void> = [];
      clsService.transactionHooks.getStore.mockReturnValue(hooks);

      const callback = jest.fn();
      service.onCommit(callback);

      expect(callback).not.toHaveBeenCalled();
      expect(hooks).toEqual([callback]);
    });

    it('executa o callback imediatamente fora de transação', () => {
      clsService.transactionHooks.getStore.mockReturnValue(undefined);

      const callback = jest.fn();
      service.onCommit(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
