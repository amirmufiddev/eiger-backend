# Backend Architecture Guidelines

## Tech Stack
*   **Core**: Node.js 20+, NestJS dengan Fastify adapter (`@nestjs/platform-fastify`)
*   **Database**: Drizzle ORM + PostgreSQL 15+
*   **Cache & Realtime**: Redis + Socket.io adapter (`ioredis`, `@socket.io/redis-adapter`)

## Prinsip SOLID & Clean Architecture
*   **Policy Terpisah**: Guard (`@Roles()` / `RolesGuard`) memutus authorize tanpa mencampur di handler bisnis
*   **Single Responsibility**: Use case checkout tetap satu kelas satu alasan ubah
*   **Layering**: CRUD admin melalui application services dedikasi (misal: `AdminProductService`) dengan injeksi repository

## Security & Auth
*   **Custom Session**: Token-based session disimpan di tabel `sessions` di database (bukan JWT atau Better-Auth) Token expiration 30 hari
*   **Middleware**: Wajib menggunakan `@fastify/helmet`, `@fastify/cors` (origin dari env, credentials true), `@fastify/csrf`, `@fastify/rate-limit`, dan `@fastify/compression`

## Transaksi Atomik (Checkout)
*   Wajib menggunakan `db.transaction()`
*   Satu transaksi mencakup: cek saldo → insert transaction + items → kurangi wallet → increment poin membership
*   Rollback total jika gagal

## Logging
*   Menggunakan `nest-winston` + Winston (Console transport colored & File transport `logs/error.log`)
*   `AllExceptionsFilter` menangkap dan melakukan log pada semua error

## Struktur Project
```
backend/src/
├── main.ts                              # Fastify + security + swagger bootstrap
├── app.module.ts                        # Root module
├── common/
│   ├── logger/
│   │   └── winston.logger.ts           # WinstonLogger (nest-winston)
│   ├── filters/
│   │   └── all-exceptions.filter.ts    # Global exception filter
│   ├── interceptors/
│   │   └── logging.interceptor.ts       # Request/response logging
│   ├── guards/
│   │   ├── auth.guard.ts               # Token validation
│   │   └── roles.guard.ts              # Role-based access
│   └── decorators/
│       ├── roles.decorator.ts           # @Roles('admin')
│       └── current-user.decorator.ts   # @CurrentUser()
├── infrastructure/
│   ├── database/
│   │   ├── database.module.ts          # Drizzle connection
│   │   ├── schema.ts                  # All entity schemas
│   │   └── seed.ts                    # Seed data script
│   └── redis/
│       └── redis.module.ts             # Redis module + RedisService
├── modules/
│   └── {module_name}/
│       ├── {module_name}.module.ts
│       ├── controllers/
│       │   ├── {module_name}.admin.controller.ts
│       │   └── {module_name}.member.controller.ts
│       ├── services/
│       │   └── {module_name}.service.ts    # UNIFIED service
│       ├── repository/
│       │   └── {module_name}.repository.ts
│       └── dto/
│           ├── index.ts
│           ├── request/
│           └── response/
├── router/
│   ├── router.module.ts                # Aggregates route modules
│   └── routes/
│       ├── routes.admin.module.ts       # Admin route aggregation
│       └── routes.member.module.ts      # Member route aggregation
└── events/
    ├── events.module.ts
    └── events.gateway.ts               # WebSocket + Redis adapter
```