import { AsyncLocalStorage } from 'async_hooks';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const prismaTransactionLocalStorage =
  new AsyncLocalStorage<Prisma.TransactionClient>();

// Callbacks queued during a transaction and run once it commits. Lets writes
// that must survive a rollback (the audit trail) escape the transaction
// without recording events for work that was aborted.
const transactionHooksLocalStorage = new AsyncLocalStorage<Array<() => void>>();

@Injectable()
export class ClsService {
  public readonly prismaTransaction: typeof prismaTransactionLocalStorage;
  public readonly transactionHooks: typeof transactionHooksLocalStorage;

  constructor() {
    this.prismaTransaction = prismaTransactionLocalStorage;
    this.transactionHooks = transactionHooksLocalStorage;
  }
}
