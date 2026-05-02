---
name: eiger-backend-clean-architecture
overview: "Implementasi backend Eiger Adventure Land dengan clean architecture: NestJS + Drizzle ORM + Redis + WebSocket + Fastify"
todos: []
isProject: false
---

---

name: eiger-backend-clean-architecture
overview: Implementasi backend Eiger Adventure Land dengan clean architecture pattern, NestJS + Fastify + Drizzle ORM + Redis + WebSocket
todos: []
isProject: false

---

# Plan: Modul Eiger Backend - Clean Architecture

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Workflow

Ikuti fase **Phase 1–5** dengan skill Superpowers yang relevan:

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Klarifikasi scope, risiko concurrency checkout, kontrak API BE-FE | `/brainstorming` |
| 2 | Setup project NestJS dengan Fastify, Redis, logging | `/using-git-worktrees` |
| 3 | Tulis/maintain dokumen plan ini | `/writing-plans` |
| 4 | Implementasi paralel: auth, product, payment, membership, wallet, transaction, report | `/subagent-driven-development` atau `/executing-plans` |
| 5 | Review, CI hijau, merge | `/requesting-code-review`, `/finishing-a-development-branch` |

### Tech Stack

```bash
# Paket utama (latest NestJS)
@nestjs/core @nestjs/common @nestjs/platform-fastify
@nestjs/config @nestjs/swagger @nestjs/websockets @nestjs/platform-socket.io
@nestjs/jwt @nestjs/passport passport
drizzle-orm postgres better-auth
nest-winston winston
helmet @fastify/helmet @fastify/cors @fastify/csrf @fastify/rate-limit @fastify/compression
ioredis @socket.io/redis-adapter socket.io
class-validator class-transformer
uuid
```

### Prerequisites Checklist

- [x] NestJS CLI terinstall (`npm i -g @nestjs/cli`)
- [ ] Git remote configured
- [ ] PostgreSQL database created
- [ ] Redis server running
- [ ] `.env` configured

---

## Architecture

```mermaid
flowchart TD
    Client -->|HTTP/WS| Fastify_Adapter[NestJS + Fastify Adapter]
    Fastify_Adapter -->|Helmet/CORS/CSRF/RateLimit| Security_Middleware
    Security_Middleware -->|Guards| Controllers
    
    Controllers -->|Member| Member_Controllers
    Controllers -->|Admin| Admin_Controllers
    
    Member_Controllers -->|RoutesMemberModule| Services
    Admin_Controllers -->|RoutesAdminModule| Services
    
    Services --> Repositories
    Repositories -->|Drizzle ORM| PostgreSQL
    
    Fastify_Adapter -->|Redis Adapter| Redis[(Redis)]
    Redis -->|Socket.io| WebSocket_Gateway[EventsGateway]
    
    subgraph "Router Layer"
        RouterModule
        RoutesMemberModule
        RoutesAdminModule
    end
    
    subgraph "Modules"
        AuthModule
        ProductModule
        PaymentMethodModule
        MembershipModule
        WalletModule
        TransactionModule
        ReportModule
    end
    
    subgraph "Events"
        EventsModule
        EventsGateway
    end
```

### Folder Structure

```
backend/src/
├── main.ts                              # Fastify + security + swagger bootstrap
├── app.module.ts                        # Root module
├── common/
│   ├── logger/
│   │   └── winston.logger.ts           # WinstonLogger (nest-winston)
│   ├── filters/
│   │   └── all-exceptions.filter.ts    # Global exception filter (logs errors)
│   ├── interceptors/
│   │   └── logging.interceptor.ts      # Request/response logging
│   ├── guards/
│   │   ├── auth.guard.ts              # JWT/Bearer token validation
│   │   └── roles.guard.ts             # Role-based access (admin/member)
│   └── decorators/
│       ├── roles.decorator.ts         # @Roles('admin')
│       └── current-user.decorator.ts   # @CurrentUser()
├── infrastructure/
│   ├── database/
│   │   ├── database.module.ts         # Drizzle connection
│   │   ├── schema.ts                 # All entity schemas
│   │   └── seed.ts                   # Seed data script
│   └── redis/
│       └── redis.module.ts            # Redis module + RedisService
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
│           │   ├── create-{module}.dto.ts
│           │   └── update-{module}.dto.ts
│           └── response/
│               └── {module}.response.dto.ts
├── router/
│   ├── router.module.ts               # Aggregates route modules
│   └── routes/
│       ├── routes.admin.module.ts     # Admin route aggregation
│       └── routes.member.module.ts    # Member route aggregation
└── events/
    ├── events.module.ts
    └── events.gateway.ts             # WebSocket + Redis adapter
```

---

## 1. Overview

Backend Eiger Adventure Land adalah sistem cashless dan single-identity pass yang dibangun dengan:

- **NestJS** dengan **Fastify** sebagai HTTP adapter
- **Drizzle ORM** dengan PostgreSQL untuk data persistence
- **Redis** dengan Socket.io adapter untuk real-time events dan caching
- **Clean Architecture** dengan Repository pattern
- **Role-based routing** (admin/member dipisah di router layer)
- **nest-winston** untuk structured logging
- **Security middleware** (Helmet, CORS, CSRF, Rate Limit, Compression)

---

## 2. Requirements

### Environment Variables

```env
# Application
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/eiger

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

---

## 3. API Endpoints

### Public Endpoints

| Method | Endpoint | Access | Deskripsi |
|--------|----------|--------|-----------|
| POST | `/auth/register` | Public | Register member baru |
| POST | `/auth/login` | Public | Login |
| GET | `/products` | Member | Get semua product aktif |

### Member Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/logout` | Logout |
| GET | `/payment-methods` | Get payment methods aktif |
| GET | `/membership/profile` | Get profile membership |
| GET | `/wallet/balance` | Get wallet balance |
| POST | `/wallet/topup` | Topup wallet |
| POST | `/transactions/checkout` | Checkout transaksi |
| GET | `/transactions` | Get history transaksi |
| GET | `/transactions/:id` | Get detail transaksi |
| POST | `/transactions/:id/cancel` | Cancel transaksi pending |

### Admin Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/products` | Get semua product |
| POST | `/admin/products` | Create product |
| PATCH | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Delete product |
| GET | `/admin/payment-methods` | Get semua payment method |
| POST | `/admin/payment-methods` | Create payment method |
| PATCH | `/admin/payment-methods/:id` | Update payment method |
| DELETE | `/admin/payment-methods/:id` | Delete payment method |
| GET | `/admin/membership` | Get semua membership |
| PATCH | `/admin/membership/:id` | Update tier/points |
| GET | `/admin/wallet` | Get semua wallet |
| POST | `/admin/wallet/:userId/topup` | Topup wallet user |
| GET | `/admin/transactions` | Get semua transaksi |
| GET | `/admin/reports/revenue` | Revenue report |
| GET | `/admin/reports/transactions` | Transaction report |
| GET | `/admin/reports/membership` | Membership report |

---

## 4. Database Schema

### ER Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar name
        user_role role
        timestamp created_at
        timestamp updated_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        text token UK
        timestamp expires_at
        varchar ip_address
        text user_agent
        timestamp created_at
        timestamp updated_at
    }

    MEMBERSHIPS {
        uuid id PK
        uuid user_id FK UK
        varchar tier
        integer points
        timestamp created_at
        timestamp updated_at
    }

    WALLETS {
        uuid id PK
        uuid user_id FK UK
        numeric balance
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
        uuid id PK
        varchar name
        text description
        numeric price
        numeric cost_price
        numeric operational_cost
        integer is_active
        timestamp created_at
        timestamp updated_at
    }

    PAYMENT_METHODS {
        uuid id PK
        varchar code UK
        varchar name
        integer is_active
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid payment_method_id FK
        transaction_status status
        numeric total
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTION_ITEMS {
        uuid id PK
        uuid transaction_id FK
        uuid product_id FK
        integer qty
        numeric unit_price
        timestamp created_at
    }

    USERS ||--o{ SESSIONS : "has"
    USERS ||--|| MEMBERSHIPS : "has_one"
    USERS ||--|| WALLETS : "has_one"
    USERS ||--o{ TRANSACTIONS : "makes"
    TRANSACTIONS ||--|| PAYMENT_METHODS : "uses"
    TRANSACTIONS ||--o{ TRANSACTION_ITEMS : "contains"
    TRANSACTION_ITEMS ||--|| PRODUCTS : "references"
```

### Entity Descriptions

| Table | Deskripsi |
|-------|-----------|
| `users` | User account dengan role admin/member |
| `sessions` | Session tokens untuk authentication |
| `memberships` | Membership tier dan points per user |
| `wallets` | E-wallet balance per user |
| `products` | Produk/tiket yang dijual (active/inactive) |
| `payment_methods` | Metode pembayaran (EWALLET, VA, QRIS, CC) |
| `transactions` | Header transaksi |
| `transaction_items` | Item-item dalam transaksi |

---

## 5. Module Structure

### Pattern: Unified Service + Split Controllers

Setiap module memiliki:

1. **Single Service** (`{module}.service.ts`) - semua business logic
2. **Split Controllers**:
   - `{module}.admin.controller.ts` - admin-only endpoints
   - `{module}.member.controller.ts` - member-accessible endpoints
3. **Repository** (`{module}.repository.ts`) - data access layer

### Module Dependencies

```mermaid
flowchart LR
    subgraph "Router Layer"
        RM[RoutesMemberModule]
        RA[RoutesAdminModule]
    end
    
    subgraph "Modules"
        Auth[AuthModule]
        Product[ProductModule]
        Payment[PaymentMethodModule]
        Membership[MembershipModule]
        Wallet[WalletModule]
        Transaction[TransactionModule]
        Report[ReportModule]
    end
    
    RM --> Auth
    RM --> Product
    RM --> Payment
    RM --> Membership
    RM --> Wallet
    RM --> Transaction
    
    RA --> Product
    RA --> Payment
    RA --> Membership
    RA --> Wallet
    RA --> Transaction
    RA --> Report
```

---

## 6. Core Features

### 6.1 Authentication (Auth Module)

- Register member baru (auto-create wallet + membership)
- Login dengan email/password → return token
- Session-based authentication dengan token
- Logout

### 6.2 Product Management

- Member: GET active products
- Admin: CRUD all products (soft delete untuk produk yang sudah ada transaksi)

### 6.3 Payment Method

- Member: GET active payment methods
- Admin: CRUD payment methods

### 6.4 Membership

- Member: GET own membership profile
- Admin: GET all memberships, update tier/points

### 6.5 Wallet

- Member: GET balance, topup
- Admin: GET all wallets, topup untuk user lain

### 6.6 Transaction

- Checkout: validasi stock, deduct balance, create transaction items
- Member: GET history, cancel pending
- Admin: GET all transactions

### 6.7 Reports

- Admin: Revenue, transaction, membership reports

### 6.8 Events (WebSocket)

- Real-time transaction updates
- Membership updates
- Wallet updates
- Redis adapter untuk distributed deployment

---

## 7. Security Features

| Feature | Package | Configuration |
|---------|---------|---------------|
| HTTP Headers | `@fastify/helmet` | contentSecurityPolicy: false |
| CORS | `@fastify/cors` | origin dari env, credentials: true |
| CSRF | `@fastify/csrf` | cookie-based |
| Rate Limiting | `@fastify/rate-limit` | max: 100, timeWindow: 1 minute |
| Compression | `@fastify/compression` | gzip, deflate |

### Guards & Decorators

```typescript
// AuthGuard - validates Bearer token
@UseGuards(AuthGuard)

// RolesGuard - checks @Roles decorator
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')

// CurrentUser - injects user from request
@CurrentUser() user: CurrentUserData
```

---

## 8. Logging & Error Handling

### Winston Logger

- Console transport (colored output)
- File transport: `logs/error.log`, `logs/combined.log`
- Structured JSON format

### Exception Filter

Semua error di-log menggunakan WinstonLogger:

```typescript
// AllExceptionsFilter
catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(
        `HTTP ${status} - ${request.method} ${request.url}`,
        exception.stack,
        'AllExceptionsFilter'
    );
    // ... send error response
}
```

### Logging Interceptor

Log semua request/response:

```typescript
// LoggingInterceptor
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const { method, url } = request;
    return next.handle().pipe(
        tap(() => {
            this.logger.log(`${method} ${url} ${statusCode} - ${duration}ms`);
        })
    );
}
```

---

## 9. Implementation Tasks

### Task 1: Foundation Setup

- [ ] Fastify adapter setup
- [ ] Security middleware (helmet, cors, csrf, rate-limit, compression)
- [ ] nest-winston logger
- [ ] AllExceptionsFilter + LoggingInterceptor
- [ ] Redis module

### Task 2: Database Infrastructure

- [ ] Drizzle schema (8 tables)
- [ ] DatabaseModule
- [ ] Seed script

### Task 3: Common Guards & Decorators

- [ ] AuthGuard
- [ ] RolesGuard
- [ ] @Roles decorator
- [ ] @CurrentUser decorator

### Task 4: Auth Module

- [ ] AuthService (register, login, logout)
- [ ] AuthController
- [ ] AuthModule

### Task 5: Product Module

- [ ] ProductRepository
- [ ] ProductService (unified)
- [ ] ProductAdminController
- [ ] ProductMemberController
- [ ] ProductModule

### Task 6: Payment Method Module

- [ ] PaymentMethodRepository
- [ ] PaymentMethodService
- [ ] PaymentMethodAdminController
- [ ] PaymentMethodMemberController
- [ ] PaymentMethodModule

### Task 7: Membership Module

- [ ] MembershipRepository
- [ ] MembershipService
- [ ] MembershipAdminController
- [ ] MembershipMemberController
- [ ] MembershipModule

### Task 8: Wallet Module

- [ ] WalletRepository
- [ ] WalletService
- [ ] WalletAdminController
- [ ] WalletMemberController
- [ ] WalletModule

### Task 9: Transaction Module

- [ ] TransactionRepository
- [ ] TransactionService (checkout logic)
- [ ] TransactionAdminController
- [ ] TransactionMemberController
- [ ] TransactionModule

### Task 10: Report Module

- [ ] ReportService (revenue, transaction, membership)
- [ ] ReportAdminController
- [ ] ReportModule

### Task 11: Router Module

- [ ] RoutesMemberModule
- [ ] RoutesAdminModule
- [ ] RouterModule

### Task 12: Events Gateway

- [ ] EventsGateway (WebSocket + Redis adapter)
- [ ] EventsModule

### Task 13: Unit Tests

- [ ] Auth service tests
- [ ] Product service tests
- [ ] Wallet service tests
- [ ] Transaction service tests

### Task 14: Final Assembly

- [ ] package.json scripts
- [ ] docker-compose.yml + Dockerfile
- [ ] README.md
- [ ] docs/ folder

### Task 15: CI/CD

- [ ] GitHub Actions CI pipeline
- [ ] GitHub Actions CD pipeline
- [ ] deploy.sh script
- [ ] setup-vps.sh script

---

## 10. Individual Task Plans

Setiap task sudah di-breakdown ke file terpisah:

| Task | Plan File |
|------|-----------|
| 01 - Foundation Setup | `20260502010200_task-01-foundation-setup.plan.md` |
| 02 - Database Schema | `20260502010300_task-02-database-schema.plan.md` |
| 03 - Common Guards | `20260502010400_task-03-common-guards-decorators.plan.md` |
| 04 - Auth Module | `20260502010500_task-04-auth-module.plan.md` |
| 05 - Product Module | `20260502010600_task-05-product-module.plan.md` |
| 06 - Payment Method Module | `20260502010700_task-06-payment-method-module.plan.md` |
| 07 - Membership Module | `20260502010800_task-07-membership-module.plan.md` |
| 08 - Wallet Module | `20260502010900_task-08-wallet-module.plan.md` |
| 09 - Transaction Module | `20260502011000_task-09-transaction-module.plan.md` |
| 10 - Report Module | `20260502011100_task-10-report-module.plan.md` |
| 11 - Router Module | `20260502011200_task-11-router-module.plan.md` |
| 12 - Events Gateway | `20260502011300_task-12-events-gateway.plan.md` |
| 13 - Unit Tests | `20260502011400_task-13-unit-tests.plan.md` |
| 14 - Final Assembly | `20260502011500_task-14-final-assembly.plan.md` |
| 15 - CI/CD | `20260502011600_task-15-cicd-vps.plan.md` |

---

## 11. Edge Cases

| Scenario | Handling |
|----------|----------|
| Checkout dengan balance insufficient | BadRequestException |
| Checkout dengan product tidak ada | NotFoundException |
| Checkout dengan qty <= 0 | Validation error |
| Delete product yang ada di transaksi | Soft delete (isActive = 0) |
| Cancel transaksi yang sudah completed | BadRequestException |
| Token expired | UnauthorizedException |
| Role tidak authorized | ForbiddenException |
| Redis connection failed | Fallback graceful degradation |

---

## 12. Acceptance Criteria

### Foundation
- [ ] Fastify adapter configured
- [ ] Security middleware active (helmet, cors, csrf, rate-limit, compression)
- [ ] Winston logger replaces default logger
- [ ] AllExceptionsFilter logs all errors
- [ ] Redis module configured

### Authentication
- [ ] Member can register
- [ ] Member can login
- [ ] Member can logout
- [ ] Invalid credentials returns 401

### Products
- [ ] Member can GET active products
- [ ] Admin can CRUD all products
- [ ] Soft delete for products with transactions

### Payment Methods
- [ ] Member can GET active payment methods
- [ ] Admin can CRUD payment methods

### Membership
- [ ] Member can GET own membership
- [ ] Admin can GET all memberships
- [ ] Admin can update tier/points

### Wallet
- [ ] Member can GET balance
- [ ] Member can topup
- [ ] Admin can GET all wallets
- [ ] Admin can topup any user

### Transactions
- [ ] Member can checkout
- [ ] Balance deducted on checkout
- [ ] Points added to membership
- [ ] Member can view transaction history
- [ ] Member can cancel pending transaction
- [ ] Admin can view all transactions

### Reports
- [ ] Admin can view revenue report
- [ ] Admin can view transaction report
- [ ] Admin can view membership report

### Events
- [ ] WebSocket server starts
- [ ] Redis adapter configured
- [ ] Client connection/disconnection handled

### CI/CD
- [ ] CI pipeline runs on push
- [ ] CD pipeline deploys to VPS
- [ ] Health check verified

---

## 13. Catatan Asumsi

1. NestJS project sudah di-generate via `nest new eiger-backend`
2. PostgreSQL dan Redis sudah jalan di environment
3. Session-based auth (bukan JWT) dengan token di database
4. Better-auth tidak digunakan, custom session implementation
5. No transactional outbox - langsung deduct balance di checkout
6. Soft delete untuk product yang sudah ada transaksi
7. Logs directory perlu di-create manual untuk Winston file transport
8. Docker setup untuk development dan production berbeda docker-compose files
