import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import csrf from '@fastify/csrf';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WebSocketAdapter } from './common/adapters/websocket.adapter';

async function bootstrap() {
  const winstonInstance = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike('EigerAPI', {
            colors: true,
            prettyPrint: true,
            processId: true,
            appName: true,
          }),
        ),
      }),
      new (DailyRotateFile)({
        level: 'error',
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: '14d',
      }),
      new (DailyRotateFile)({
        level: 'warn',
        filename: 'logs/warn-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: '14d',
      }),
      new (DailyRotateFile)({
        level: 'debug',
        filename: 'logs/debug-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: '14d',
      }),
    ],
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: winstonInstance,
    },
  );

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
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

  app.useLogger(winstonInstance as any);
  app.useGlobalFilters(new AllExceptionsFilter(winstonInstance));
  app.useGlobalInterceptors(new LoggingInterceptor(winstonInstance));
  app.useWebSocketAdapter(new WebSocketAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('Eiger Adventure Land API')
    .setDescription('Cashless & Single-Identity Pass System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api`);
}

bootstrap();
