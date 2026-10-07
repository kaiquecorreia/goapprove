import { Injectable } from '@nestjs/common';
import { PrismaService, TransactionOptions } from './prisma.service';
import { ClsService } from './cls.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly clsService: ClsService,
  ) {}

  // options only apply to the outermost call: a nested run() joins the
  // transaction already open, with whatever timeout it was given.
  async run<T>(fn: () => Promise<T>, options?: TransactionOptions): Promise<T> {
    const existing = this.clsService.prismaTransaction.getStore();
    if (existing) {
      return fn();
    }
    return this.prismaService.runInTransaction(fn, options);
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
