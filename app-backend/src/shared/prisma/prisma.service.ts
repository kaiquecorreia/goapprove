import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { ClsService } from './cls.service';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private readonly prisma: PrismaClient;

  constructor(private readonly clsService: ClsService) {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : undefined,
    });

    const adapter = new PrismaPg(this.pool);

    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Prisma');

    await this.prisma.$disconnect();
    await this.pool.end();
  }

  getClient(): PrismaClient | Prisma.TransactionClient {
    const txClient = this.clsService.prismaTransaction.getStore();

    if (txClient) {
      return txClient;
    }

    return this.prisma;
  }

  // The root client, ignoring any transaction in progress. Used by writes that
  // must not be rolled back with the surrounding work (the audit trail), which
  // getClient() cannot provide since it always prefers the transaction client.
  getRootClient(): PrismaClient {
    return this.prisma;
  }

  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    const hooks: Array<() => void> = [];

    const result = await this.prisma.$transaction(async (tx) => {
      return this.clsService.prismaTransaction.run(tx, () =>
        this.clsService.transactionHooks.run(hooks, fn),
      );
    });

    // Only reached once the transaction committed.
    for (const hook of hooks) {
      try {
        hook();
      } catch (error) {
        this.logger.error('Post-commit hook failed', error as Error);
      }
    }

    return result;
  }
}
