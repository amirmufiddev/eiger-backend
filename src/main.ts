import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import fastifyStatic from '@fastify/static';
import path from 'path';

import csrf from '@fastify/csrf';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WebSocketAdapter } from './common/adapters/websocket.adapter';
import { AppLoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: false,
    },
  );

  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN')!;
  const port = configService.get<number>('PORT')!;

  const appLogger = app.get(AppLoggerService);
  app.useLogger(appLogger);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.register(helmet as any, { contentSecurityPolicy: false });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.register(cors as any, {
    origin: corsOrigin,
    credentials: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.register(csrf as any);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.register(rateLimit as any, { max: 100, timeWindow: '1 minute' });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.register(compress as any, { encodings: ['gzip', 'deflate'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useWebSocketAdapter(new WebSocketAdapter(app));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Eiger Adventure Land API')
    .setDescription('Cashless & Single-Identity Pass System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Serve Swagger UI static files
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.register(fastifyStatic as any, {
    root: path.join(__dirname, '..', 'node_modules', 'swagger-ui-static'),
    prefix: '/swagger-ui/',
    decorateReply: false,
  });

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'swagger/json',
    customCss: `
      @import url('/swagger-ui/swagger-ui.css');
      .swagger-ui .topbar { display: none }
    `,
  });

  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

void bootstrap();
