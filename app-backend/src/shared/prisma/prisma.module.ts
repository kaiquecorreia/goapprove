import { Module } from '@nestjs/common';

import { ClsService } from './cls.service';
import { PrismaService } from './prisma.service';

@Module({
  providers: [ClsService, PrismaService],
  exports: [ClsService, PrismaService],
})
export class PrismaModule {}
