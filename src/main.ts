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
import csrf from '@fastify/csrf';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
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

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.register(csrf as any);
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(compress, { encodings: ['gzip', 'deflate'] });

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
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api`);
}

void bootstrap();
