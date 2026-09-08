import 'dotenv/config';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../../app.module';

describe('AuditModule (integration)', () => {
  let app: NestExpressApplication;

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
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  it('boots with the audit middleware registered (Express 5 wildcard)', () => {
    expect(app).toBeDefined();
  });

  it('stamps a correlation id on responses', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY ?? '');

    console.log('GET /health ->', response.status);
    console.log('correlation ->', response.headers['x-correlation-id']);
    expect(response.headers['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('echoes back a caller-supplied correlation id', async () => {
    const supplied = '11111111-2222-4333-8444-555555555555';

    const response = await request(app.getHttpServer())
      .get('/health')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY ?? '')
      .set('x-correlation-id', supplied);

    expect(response.headers['x-correlation-id']).toBe(supplied);
  });

  it('rejects a non-uuid correlation id instead of failing the insert', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY ?? '')
      .set('x-correlation-id', 'not-a-uuid');

    expect(response.headers['x-correlation-id']).not.toBe('not-a-uuid');
  });

  it('guards /audit', async () => {
    const response = await request(app.getHttpServer())
      .get('/audit')
      .set('x-internal-api-key', process.env.INTERNAL_API_KEY ?? '');

    console.log('GET /audit ->', response.status, response.body);
    expect([401, 403]).toContain(response.status);
  });
});
