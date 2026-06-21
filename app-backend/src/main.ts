import 'dotenv/config';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export async function bootstrap() {
  const server = express();

  const adapter = new ExpressAdapter(server);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    adapter,
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3002',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('GoApprove API')
    .setDescription('API for managing GoApprove')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  console.log('Starting GoApprove API on port', process.env.PORT ?? 3013);
  await app.listen(process.env.PORT ?? 3013);
}
bootstrap()
  .then()
  .catch((error) => console.error(error));
