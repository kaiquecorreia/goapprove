import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ClsService } from './cls.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly clsService: ClsService,
  ) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const existing = this.clsService.prismaTransaction.getStore();
    if (existing) {
      return fn();
    }
    return this.prismaService.runInTransaction(fn);
  }

  isActive(): boolean {
    return this.clsService.prismaTransaction.getStore() !== undefined;
  }

  // Runs after the outermost transaction commits, or immediately when there is
  // no transaction. Since run() is reentrant, nested calls queue onto the
  // outermost transaction's hook list, which is what callers expect.
  onCommit(callback: () => void): void {
    const hooks = this.clsService.transactionHooks.getStore();

    if (hooks) {
      hooks.push(callback);
      return;
    }

    callback();
  }
}
