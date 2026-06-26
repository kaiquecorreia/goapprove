import { Module } from '@nestjs/common';

import { ClsService } from './cls.service';
import { PrismaService } from './prisma.service';
import { TransactionService } from './transaction.service';

@Module({
  providers: [ClsService, PrismaService, TransactionService],
  exports: [ClsService, PrismaService, TransactionService],
})
export class PrismaModule {}
