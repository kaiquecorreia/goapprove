import 'dotenv/config';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import { AppModule } from '../../app.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditContextService } from './context/audit-context.service';
import { AuditWriter } from './services/audit-writer.service';
import { AuditService } from './services/audit.service';

const ADMIN_EMAIL = 'kaique.rc.tl@gmail.com';

describe('audit end-to-end', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  let adminUserId: string;
  const apiKey = process.env.INTERNAL_API_KEY ?? '';

  beforeAll(async () => {
    const server = express();
    app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(server),
    );
    app.set('trust proxy', 'loopback');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const admin = await prisma.getRootClient().user.findUniqueOrThrow({
      where: { email: ADMIN_EMAIL },
    });
    adminUserId = admin.userId;

    token = app
      .get(JwtService)
      .sign(
        { sub: admin.userId, role: admin.role, email: admin.email },
        { secret: process.env.JWT_SECRET },
      );
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  function authed(path: string) {
    return request(app.getHttpServer())
      .get(path)
      .set('x-internal-api-key', apiKey)
      .set('Authorization', `Bearer ${token}`);
  }

  it('returns the backfilled workflow trail through GET /audit', async () => {
    const response = await authed(
      '/audit?dateFrom=2020-01-01T00:00:00.000Z&limit=100',
    ).expect(200);

    const body = response.body as {
      items: Record<string, unknown>[];
      total: number;
      page: number;
      limit: number;
    };

    expect(body.page).toBe(1);
    expect(body.total).toBeGreaterThanOrEqual(5);

    const actions = body.items.map((item) => item.action);
    expect(actions).toContain('workflow.decision_recorded');

    const decision = body.items.find(
      (item) => item.action === 'workflow.decision_recorded',
    );
    expect(decision).toMatchObject({
      entity: 'PurchaseOrder',
      severity: 'success',
      user: 'Kaique Correia',
    });
  });

  it('records a new event with actor, ip, user agent and correlation id', async () => {
    const correlationId = '9a9a9a9a-1111-4111-8111-222222222222';

    // Drives the write exactly the way a decorated handler does.
    const auditService = app.get(AuditService);
    const auditContext = app.get(AuditContextService);

    auditContext.run(
      {
        correlationId,
        ip: '203.0.113.7',
        userAgent: 'JestAgent/1.0',
        httpMethod: 'PATCH',
        httpPath: '/rules/e2e',
        actor: {
          type: 'USER',
          userId: adminUserId,
          label: 'Kaique Correia',
        },
      },
      () => {
        auditContext.setBefore({ name: 'Before name', password: 'hunter2' });
        auditService.log({
          action: 'rule.update',
          entity: 'Rule',
          entityId: 'e2e-rule',
          after: { name: 'After name', clientSecret: 'sh-should-not-persist' },
        });
      },
    );

    await app.get(AuditWriter).flush();

    const stored = await prisma.getRootClient().auditEvent.findFirstOrThrow({
      where: { correlationId },
    });

    expect(stored).toMatchObject({
      action: 'rule.update',
      entity: 'Rule',
      entityId: 'e2e-rule',
      actorUserId: adminUserId,
      actorLabel: 'Kaique Correia',
      actorType: 'USER',
      ip: '203.0.113.7',
      userAgent: 'JestAgent/1.0',
      httpMethod: 'PATCH',
    });

    // Credentials must never reach the column.
    expect(JSON.stringify(stored.before)).toContain('[REDACTED]');
    expect(JSON.stringify(stored.before)).not.toContain('hunter2');
    expect(JSON.stringify(stored.after)).toContain('[REDACTED]');
    expect(JSON.stringify(stored.after)).not.toContain('sh-should-not-persist');

    // Readable back through the API, filtered by correlation id.
    const response = await authed(
      `/audit?correlationId=${correlationId}&dateFrom=2020-01-01T00:00:00.000Z`,
    ).expect(200);

    const body = response.body as { items: { id: string }[]; total: number };
    expect(body.total).toBe(1);

    await prisma
      .getRootClient()
      .auditEvent.deleteMany({ where: { correlationId } });
  });

  it('rejects unbounded free-text search instead of running a sequential scan', async () => {
    await authed(
      '/audit?search=anything&dateFrom=2020-01-01T00:00:00.000Z',
    ).expect(400);
  });

  it('serves the OC timeline from the generic table', async () => {
    const workflow = await prisma
      .getRootClient()
      .approvalWorkflow.findFirstOrThrow();

    const response = await authed(
      `/workflows/${workflow.purchaseOrderId}`,
    ).expect(200);

    const body = response.body as {
      auditEvents: { createdAt: string; message: string; severity: string }[];
    };

    expect(body.auditEvents.length).toBeGreaterThan(0);
    expect(body.auditEvents[0]).toHaveProperty('createdAt');
    expect(body.auditEvents[0]).toHaveProperty('severity');
  });
});
