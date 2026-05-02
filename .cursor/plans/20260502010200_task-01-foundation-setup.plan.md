---
name: task-01-foundation-setup
overview: "Task 1: Setup Fastify + Security Middleware + nest-winston Logging + Redis Infrastructure"
status: built
todos: []
isProject: false
---

# Plan: Task 01 - Foundation Setup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas                        | Skill                             |
| ---- | -------------------------------- | --------------------------------- |
| 1    | Buat GitHub Issue untuk task ini | `/github-mcp-server`              |
| 2    | Implementasi foundation          | `/executing-plans`                |
| 3    | Buat PR setelah selesai          | `/finishing-a-development-branch` |

### Prerequisites Checklist

- [x] NestJS project sudah dibuat (`nest new eiger-backend`)
- [x] Git remote sudah configured
- [ ] PostgreSQL dan Redis jalan

---

## 1. Overview

Task ini membuat fondasi backend: Fastify adapter, security middleware (helmet, cors, csrf, rate-limit, compression), nest-winston logger, dan Redis module.

### Tanggung Jawab

- Setup Fastify sebagai HTTP adapter
- Setup security middleware
- Setup Winston logger dengan exception filter
- Setup Redis module untuk Socket.io adapter

---

## 2. Requirements

### Tech Stack

```
@nestjs/platform-fastify
@fastify/helmet @fastify/cors @fastify/csrf @fastify/rate-limit @fastify/compression
nest-winston winston
ioredis
```

### Environment

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/eiger
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000
PORT=4000
NODE_ENV=development
LOG_LEVEL=info
```

---

## 3. Files to Create/Modify

### New Files

```
backend/src/
├── main.ts                          # Fastify + security middleware setup
├── common/
│   ├── logger/
│   │   └── winston.logger.ts       # WinstonLogger implementation
│   ├── filters/
│   │   └── all-exceptions.filter.ts # Exception filter with logging
│   └── interceptors/
│       └── logging.interceptor.ts   # Request/response logging
└── infrastructure/
    └── redis/
        └── redis.module.ts          # Redis module + service
```

### Modify Files

```
backend/src/
└── app.module.ts                   # Import infrastructure modules
```

---

## 4. Implementation Steps

### Step 1: Install Dependencies

```bash
cd backend
pnpm install @nestjs/platform-fastify @fastify/helmet @fastify/cors @fastify/csrf @fastify/rate-limit @fastify/compression nest-winston winston ioredis
```

### Step 2: Create WinstonLogger

```typescript
// src/common/logger/winston.logger.ts
import { Injectable, LoggerService } from "@nestjs/common";
import * as winston from "winston";

@Injectable()
export class WinstonLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

### Step 3: Create AllExceptionsFilter

```typescript
// src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { Request, Reply } from "fastify";
import { WinstonLogger } from "../logger/winston.logger";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: WinstonLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const reply = ctx.getReply<Reply>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    this.logger.error(
      `HTTP ${status} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
      "AllExceptionsFilter",
    );

    reply.status(status).send({
      statusCode: status,
      message: typeof message === "string" ? message : (message as any).message,
      error: (message as any).error || "Error",
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Step 4: Create LoggingInterceptor

```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { WinstonLogger } from "../logger/winston.logger";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: WinstonLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.logger.log(
          `${method} ${url} ${response.statusCode} - ${Date.now() - now}ms`,
          "HTTP",
        );
      }),
    );
  }
}
```

### Step 5: Create RedisModule

```typescript
// src/infrastructure/redis/redis.module.ts
import { Module, Global, Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}

@Global()
@Module({
  providers: [
    RedisService,
    { provide: REDIS_CLIENT, useExisting: RedisService },
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
```

### Step 6: Update main.ts

```typescript
// src/main.ts
import {
  NestFactory,
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { WsAdapter } from "@nestjs/websockets";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import csrf from "@fastify/csrf";
import rateLimit from "@fastify/rate-limit";
import compression from "@fastify/compression";
import { AppModule } from "./app.module";
import { WinstonLogger } from "./common/logger/winston.logger";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: new WinstonLogger(),
    },
  );

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  });
  await app.register(csrf, {
    cookie: { key: "_csrf", parseJson: false, httpOnly: true, sameSite: false },
  });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(compression, { encodings: ["gzip", "deflate"] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useWebSocketAdapter(new WsAdapter(app));

  const config = new DocumentBuilder()
    .setTitle("Eiger Adventure Land API")
    .setDescription("Cashless & Single-Identity Pass System")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api`);
}

bootstrap();
```

### Step 7: Update AppModule

```typescript
// src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RedisModule } from "./infrastructure/redis/redis.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RedisModule],
})
export class AppModule {}
```

### Step 8: Create logs directory

```bash
mkdir -p backend/logs
touch backend/logs/.gitkeep
```

### Step 9: Verify Build

```bash
pnpm run build
```

---

## 5. GitHub Issue & PR Instructions

### Before Implementation - Create GitHub Issue

Gunakan MCP GitHub untuk membuat issue:

```
Title: [Task 01] Foundation Setup - Fastify + Security + Logging + Redis
Labels: backend, task-01, priority:P1
Body: ## Overview
Setup fondasi backend dengan Fastify adapter, security middleware, Winston logger, dan Redis module.

## Acceptance Criteria
- [x] Fastify adapter configured
- [x] Security middleware active (helmet, cors, csrf, rate-limit, compression)
- [x] Winston logger replaces default logger
- [x] AllExceptionsFilter logs all errors
- [x] Redis module configured
- [x] Build successful
```

### After Implementation - Create PR

1. Buat branch:

```bash
git checkout -b task/01-foundation-setup
git add -A
git commit -m "feat: setup foundation - Fastify, security, logging, Redis"
git push -u origin task/01-foundation-setup
```

2. Buat PR dengan title: `[Task 01] Foundation Setup`

---

## 6. Catatan Asumsi

1. NestJS project sudah di-generate via `nest new eiger-backend`
2. PostgreSQL dan Redis sudah jalan di environment
3. Logs directory perlu di-create karena Winston file transport tidak auto-create

---

## 7. Verification Checklist

- [x] Fastify adapter works
- [x] Security middleware active (helmet, cors, csrf, rate-limit, compression)
- [x] nest-winston replaces default logger
- [x] AllExceptionsFilter logs all errors
- [x] LoggingInterceptor logs requests
- [x] Redis connection configured
- [x] Build successful
- [x] GitHub issue created
- [ ] PR created
