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
      bufferLogs: true,
      bodyParser: false,
    },
  );

  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN')!;
  const port = configService.get<number>('PORT')!;

  const appLogger = app.get(AppLoggerService);
  app.useLogger(appLogger);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.register(helmet as any, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https:`, `'unsafe-inline'`],
      },
    },
  });

  app.setGlobalPrefix('api');
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

  const config = new DocumentBuilder()
    .setTitle('Eiger Adventure Land API')
    .setDescription('Cashless & Single-Identity Pass System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'swagger/json',
  });

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

  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/docs`);
}

void bootstrap();
