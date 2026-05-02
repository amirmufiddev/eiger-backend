---
name: task-14-final-assembly
overview: "Task 14: Final Assembly - Integration Test, Package.json, README"
todos:
  - id: 1
    content: "Buat GitHub Issue untuk Task 14"
    status: pending
  - id: 2
    content: "Update package.json scripts (build, start, test, db:*)"
    status: pending
  - id: 3
    content: "Create .env.example"
    status: pending
  - id: 4
    content: "Update README.md"
    status: pending
  - id: 5
    content: "Verify build successful"
    status: pending
  - id: 6
    content: "Run tests verify all passing"
    status: pending
  - id: 7
    content: "Buat PR ke branch task/14-final-assembly"
    status: pending
isProject: false
---

# Plan: Task 14 - Final Assembly

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas                        | Skill                             |
| ---- | -------------------------------- | --------------------------------- |
| 1    | Buat GitHub Issue untuk task ini | `issue_write` MCP tool            |
| 2    | Final Assembly                   | `/executing-plans`                |
| 3    | Buat PR setelah selesai          | `/finishing-a-development-branch` |

### Fase 1 - Create GitHub Issue

Gunakan `issue_write` tool dari `user-github-mcp-server` MCP:

```
method: "create"
owner: "amirmufiddev"
repo: "eiger-backend"
title: "[Task 14] Final Assembly - Integration Test, Package.json, README"
body: (isi overview)
labels: ["backend", "task-14", "priority:P1"]
```

Catatan: Pastikan read tool schema `issue_write.json` terlebih dahulu sebelum调用.

---

## 1. Overview

Final assembly: update package.json dengan scripts, buat README, buat .env.example, verifikasi build dan run.

---

## 2. Files to Create/Modify

```
backend/
├── package.json            # Update scripts
├── .env.example           # Create
├── README.md              # Update
├── docker-compose.yml     # Create (optional)
```

---

## 3. Implementation

### Step 1: Update package.json

```json
{
  "name": "eiger-backend",
  "version": "1.0.0",
  "description": "Eiger Adventure Land Backend - Cashless & Single-Identity Pass System",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "ts-node src/infrastructure/database/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-fastify": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@fastify/helmet": "^11.0.0",
    "@fastify/cors": "^8.0.0",
    "@fastify/csrf": "^6.0.0",
    "@fastify/rate-limit": "^9.0.0",
    "@fastify/compression": "^8.0.0",
    "@socket.io/redis-adapter": "^8.0.0",
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0",
    "better-auth": "^1.0.0",
    "nest-winston": "^1.0.0",
    "winston": "^3.11.0",
    "ioredis": "^5.3.0",
    "socket.io": "^4.6.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "uuid": "^9.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@types/uuid": "^9.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0",
    "drizzle-kit": "^0.20.0"
  }
}
```

### Step 2: Create .env.example

```env
# Application
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/eiger

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

### Step 3: Create drizzle.config.ts

```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/infrastructure/database/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Step 4: Update tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

### Step 5: Create README.md

````markdown
# Eiger Adventure Land Backend

Cashless & Single-Identity Pass System Backend using NestJS + Fastify + Drizzle ORM.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** NestJS with Fastify adapter
- **ORM:** Drizzle ORM with PostgreSQL
- **Cache/PubSub:** Redis with Socket.io adapter
- **Authentication:** JWT-based sessions
- **Logging:** Winston with nest-winston
- **Validation:** class-validator, class-transformer

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for containerized setup)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

## Quick Start with Docker

1. Clone and navigate to backend folder:

```bash
cd backend
```
````

2. Start all services:

```bash
docker-compose up -d
```

3. Access the application:

- API: http://localhost:4000
- Swagger Docs: http://localhost:4000/api
- pgAdmin: http://localhost:5050 (optional)

## Manual Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment file:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run database migrations:

```bash
pnpm run db:migrate
```

4. Seed initial data:

```bash
pnpm run db:seed
```

5. Start development server:

```bash
pnpm run start:dev
```

## Scripts

| Command               | Description               |
| --------------------- | ------------------------- |
| `pnpm run build`      | Build the application     |
| `pnpm run start:dev`  | Start in development mode |
| `pnpm run start:prod` | Start in production mode  |
| `pnpm run test`       | Run unit tests            |
| `pnpm run lint`       | Run ESLint                |
| `pnpm run db:seed`    | Seed database             |
| `pnpm run db:migrate` | Run migrations            |

## API Documentation

Swagger documentation available at: `http://localhost:4000/api`

## Project Structure

```
src/
├── common/           # Shared guards, decorators, filters, interceptors
├── infrastructure/   # Database, Redis modules
├── modules/          # Feature modules (auth, product, wallet, etc.)
├── router/          # Route aggregation by role
├── events/          # WebSocket gateway
└── main.ts          # Application entry point
```

## License

MIT

````

### Step 6: Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://eiger:eiger_secret@postgres:5432/eiger
      - REDIS_URL=redis://redis:6379
      - CORS_ORIGIN=http://localhost:3000
      - PORT=4000
      - LOG_LEVEL=info
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=eiger
      - POSTGRES_PASSWORD=eiger_secret
      - POSTGRES_DB=eiger
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@eiger.com
      - PGADMIN_DEFAULT_PASSWORD=admin123
    ports:
      - "5050:80"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
````

### Step 7: Create Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN pnpm ci

COPY . .
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN pnpm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "dist/main.js"]
```

### Step 8: Create .dockerignore

```
node_modules
dist
pnpm-debug.log
.env
.env.*
!.env.example
.git
.gitignore
README.md
coverage
.nyc_output
```

### Step 9: Create Full Documentation in docs/ folder

```markdown
# backend/docs/

├── README.md # Documentation index
├── ARCHITECTURE.md # System architecture
├── API.md # API documentation
├── DATABASE.md # Database schema & migrations
├── DEPLOYMENT.md # Deployment guide
├── DOCKER.md # Docker setup guide
└── TESTING.md # Testing guide
```

### Step 9a: Create docs/README.md

```markdown
# Eiger Backend Documentation

## Table of Contents

1. [Architecture](ARCHITECTURE.md)
2. [API Reference](API.md)
3. [Database Schema](DATABASE.md)
4. [Deployment Guide](DEPLOYMENT.md)
5. [Docker Setup](DOCKER.md)
6. [Testing Guide](TESTING.md)

---

## Quick Links

- **Swagger API Docs:** http://localhost:4000/api
- **Architecture Diagram:** See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Database Schema:** See [DATABASE.md](DATABASE.md)
```

### Step 9b: Create docs/ARCHITECTURE.md

````markdown
# Architecture Documentation

## System Overview

Eiger Adventure Land Backend adalah sistem backend untuk cashless dan single-identity pass yang dibangun dengan Clean Architecture pattern.

## Technology Stack

```mermaid
graph TD
    A[Client Apps] -->|HTTP/WS| B[NestJS + Fastify]
    B --> C[Security Middleware]
    C --> D[Modules]
    D --> E[Services]
    E --> F[Repositories]
    F --> G[Drizzle ORM]
    G --> H[PostgreSQL]
    B -->|Pub/Sub| I[Redis]
    I --> J[Socket.io]
    J --> K[Real-time Events]
```
````

## Module Structure

```mermaid
graph LR
    subgraph Router
        RM[RoutesMemberModule]
        RA[RoutesAdminModule]
    end

    subgraph Modules
        Auth[AuthModule]
        Product[ProductModule]
        Payment[PaymentMethodModule]
        Membership[MembershipModule]
        Wallet[WalletModule]
        Transaction[TransactionModule]
        Report[ReportModule]
    end

    subgraph Infrastructure
        DB[(Database)]
        Redis[(Redis)]
    end

    Router --> Modules
    Modules --> Infrastructure
```

## Request/Response Flow

```mermaid
sequenceDiagram
    Client->>Fastify: HTTP Request
    Fastify->>Security: helmet/cors/csrf
    Security->>Guards: Auth + Roles
    Guards->>Controllers: Authorized Request
    Controllers->>Services: DTO Validated
    Services->>Repositories: Domain Logic
    Repositories->>Database: SQL Query
    Database-->Repositories: Result
    Repositories-->Services: Entity
    Services-->Controllers: Response DTO
    Controllers-->>Fastify: HTTP Response
    Fastify-->>Client: JSON Response
```

## Clean Architecture Layers

| Layer      | Responsibility                | Example                  |
| ---------- | ----------------------------- | ------------------------ |
| Controller | HTTP handling, DTO validation | `ProductAdminController` |
| Service    | Business logic                | `ProductService`         |
| Repository | Data access                   | `ProductRepository`      |
| Entity     | Domain model                  | `ProductEntity`          |

## Security Architecture

- **Helmet:** HTTP headers security
- **CORS:** Cross-origin resource sharing
- **CSRF:** Cross-site request forgery protection
- **Rate Limiting:** 100 requests/minute
- **Compression:** gzip/deflate
- **Auth:** Token-based session management
- **RBAC:** Role-based access control (admin/member)

````

### Step 9c: Create docs/API.md

```markdown
# API Documentation

## Base URL

````

Development: http://localhost:4000
Production: https://api.eiger.com

```

## Authentication

Semua endpoint yang memerlukan authentication menggunakan Bearer token:

```

Authorization: Bearer <token>

````

## Public Endpoints

### Auth

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/register` | Register member baru |
| POST | `/auth/login` | Login |

### Products (Public/ Member)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/products` | Get semua product aktif |

## Protected Endpoints (Member)

### Auth

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/auth/logout` | Logout |

### Products

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/products` | Get semua product aktif |

### Payment Methods

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/payment-methods` | Get semua payment method aktif |

### Membership

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/membership/profile` | Get profile membership user |

### Wallet

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/wallet/balance` | Get wallet balance |
| POST | `/wallet/topup` | Topup wallet |

### Transactions

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/transactions/checkout` | Checkout |
| GET | `/transactions` | Get history transaksi |
| GET | `/transactions/:id` | Get detail transaksi |
| POST | `/transactions/:id/cancel` | Cancel transaksi pending |

## Protected Endpoints (Admin)

### Products

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/products` | Get semua product |
| POST | `/admin/products` | Create product |
| PATCH | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Delete product |

### Payment Methods

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/payment-methods` | Get semua payment method |
| GET | `/admin/payment-methods/:id` | Get payment method by ID |
| POST | `/admin/payment-methods` | Create payment method |
| PATCH | `/admin/payment-methods/:id` | Update payment method |
| DELETE | `/admin/payment-methods/:id` | Delete payment method |

### Membership

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/membership` | Get semua membership |
| PATCH | `/admin/membership/:id` | Update tier/points |
| PATCH | `/admin/membership/:id/add-points` | Add points |

### Wallet

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/wallet` | Get semua wallet |
| GET | `/admin/wallet/:userId` | Get wallet by userId |
| POST | `/admin/wallet/:userId/topup` | Topup wallet user |

### Transactions

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/transactions` | Get semua transaksi |
| GET | `/admin/transactions/:id` | Get detail transaksi |

### Reports

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/admin/reports/revenue` | Revenue report |
| GET | `/admin/reports/transactions` | Transaction report |
| GET | `/admin/reports/membership` | Membership report |

## WebSocket Events

### Connection

```javascript
const socket = io('http://localhost:4000/events', {
  auth: { token: 'Bearer <token>' }
});
````

### Events

| Event                   | Direction        | Payload             | Deskripsi                        |
| ----------------------- | ---------------- | ------------------- | -------------------------------- |
| `ping`                  | Client -> Server | -                   | Keep-alive                       |
| `pong`                  | Server -> Client | `{ timestamp }`     | Keep-alive response              |
| `subscribe:transaction` | Client -> Server | `{ transactionId }` | Subscribe to transaction updates |
| `transaction:update`    | Server -> Client | `{ transaction }`   | Transaction status update        |
| `membership:update`     | Server -> Client | `{ membership }`    | Membership update                |
| `wallet:update`         | Server -> Client | `{ wallet }`        | Wallet update                    |
| `notification`          | Server -> Client | `{ message, type }` | User notification                |

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/products"
}
```

## Status Codes

| Code | Deskripsi             |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 500  | Internal Server Error |

````

### Step 9d: Create docs/DATABASE.md

```markdown
# Database Documentation

## Schema Overview

Database menggunakan PostgreSQL dengan Drizzle ORM sebagai ORM.

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "has"
    USERS ||--|| MEMBERSHIPS : "has_one"
    USERS ||--|| WALLETS : "has_one"
    USERS ||--o{ TRANSACTIONS : "makes"
    TRANSACTIONS ||--|| PAYMENT_METHODS : "uses"
    TRANSACTIONS ||--o{ TRANSACTION_ITEMS : "contains"
    TRANSACTION_ITEMS ||--|| PRODUCTS : "references"
````

## Tables

### users

| Column     | Type         | Constraints                    |
| ---------- | ------------ | ------------------------------ |
| id         | UUID         | PK, DEFAULT uuid_generate_v4() |
| email      | VARCHAR(255) | NOT NULL, UNIQUE               |
| name       | VARCHAR(255) | NULL                           |
| role       | user_role    | NOT NULL, DEFAULT 'member'     |
| created_at | TIMESTAMP    | NOT NULL, DEFAULT NOW()        |
| updated_at | TIMESTAMP    | NOT NULL, DEFAULT NOW()        |

### sessions

| Column     | Type        | Constraints              |
| ---------- | ----------- | ------------------------ |
| id         | UUID        | PK                       |
| user_id    | UUID        | FK -> users.id, NOT NULL |
| token      | TEXT        | NOT NULL, UNIQUE         |
| expires_at | TIMESTAMP   | NOT NULL                 |
| ip_address | VARCHAR(45) | NULL                     |
| user_agent | TEXT        | NULL                     |
| created_at | TIMESTAMP   | NOT NULL                 |
| updated_at | TIMESTAMP   | NOT NULL                 |

### memberships

| Column     | Type        | Constraints                |
| ---------- | ----------- | -------------------------- |
| id         | UUID        | PK                         |
| user_id    | UUID        | FK -> users.id, UNIQUE     |
| tier       | VARCHAR(50) | NOT NULL, DEFAULT 'bronze' |
| points     | INTEGER     | NOT NULL, DEFAULT 0        |
| created_at | TIMESTAMP   | NOT NULL                   |
| updated_at | TIMESTAMP   | NOT NULL                   |

### wallets

| Column     | Type          | Constraints            |
| ---------- | ------------- | ---------------------- |
| id         | UUID          | PK                     |
| user_id    | UUID          | FK -> users.id, UNIQUE |
| balance    | NUMERIC(15,2) | NOT NULL, DEFAULT 0    |
| created_at | TIMESTAMP     | NOT NULL               |
| updated_at | TIMESTAMP     | NOT NULL               |

### products

| Column           | Type          | Constraints         |
| ---------------- | ------------- | ------------------- |
| id               | UUID          | PK                  |
| name             | VARCHAR(255)  | NOT NULL            |
| description      | TEXT          | NULL                |
| price            | NUMERIC(15,2) | NOT NULL            |
| cost_price       | NUMERIC(15,2) | NULL                |
| operational_cost | NUMERIC(15,2) | NULL                |
| is_active        | INTEGER       | NOT NULL, DEFAULT 1 |
| created_at       | TIMESTAMP     | NOT NULL            |
| updated_at       | TIMESTAMP     | NOT NULL            |

### payment_methods

| Column     | Type         | Constraints         |
| ---------- | ------------ | ------------------- |
| id         | UUID         | PK                  |
| code       | VARCHAR(50)  | NOT NULL, UNIQUE    |
| name       | VARCHAR(255) | NOT NULL            |
| is_active  | INTEGER      | NOT NULL, DEFAULT 1 |
| created_at | TIMESTAMP    | NOT NULL            |
| updated_at | TIMESTAMP    | NOT NULL            |

### transactions

| Column            | Type               | Constraints              |
| ----------------- | ------------------ | ------------------------ |
| id                | UUID               | PK                       |
| user_id           | UUID               | FK -> users.id           |
| payment_method_id | UUID               | FK -> payment_methods.id |
| status            | transaction_status | NOT NULL                 |
| total             | NUMERIC(15,2)      | NOT NULL                 |
| created_at        | TIMESTAMP          | NOT NULL                 |
| updated_at        | TIMESTAMP          | NOT NULL                 |

### transaction_items

| Column         | Type          | Constraints           |
| -------------- | ------------- | --------------------- |
| id             | UUID          | PK                    |
| transaction_id | UUID          | FK -> transactions.id |
| product_id     | UUID          | FK -> products.id     |
| qty            | INTEGER       | NOT NULL              |
| unit_price     | NUMERIC(15,2) | NOT NULL              |
| created_at     | TIMESTAMP     | NOT NULL              |

## Enums

### user_role

- `admin`
- `member`

### transaction_status

- `pending`
- `completed`
- `failed`
- `cancelled`

## Migrations

### Run Migrations

```bash
pnpm run db:migrate
```

### Generate Migration

```bash
pnpm run db:generate
```

### Seed Data

```bash
pnpm run db:seed
```

## Indexes

- `users_email_idx` ON users(email)
- `sessions_token_idx` ON sessions(token)
- `transactions_user_id_idx` ON transactions(user_id)
- `transaction_items_transaction_id_idx` ON transaction_items(transaction_id)

````

### Step 9e: Create docs/DEPLOYMENT.md

```markdown
# Deployment Guide

## Production Requirements

- Node.js 20+ LTS
- PostgreSQL 15+
- Redis 7+
- 2GB RAM minimum
- 10GB disk space

## Environment Variables

```env
# Application
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://eiger.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/eiger

# Redis
REDIS_URL=redis://host:6379

# Logging
LOG_LEVEL=warn
````

## Docker Deployment

### Build Image

```bash
docker build -t eiger-backend:latest .
```

### Run Container

```bash
docker run -d \
  --name eiger-backend \
  -p 4000:4000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/eiger \
  -e REDIS_URL=redis://host:6379 \
  eiger-backend:latest
```

### Using Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Manual Deployment

### 1. Build

```bash
pnpm ci --only=production
pnpm run build
```

### 2. Run Migrations

```bash
DATABASE_URL=postgresql://... pnpm run db:migrate
```

### 3. Seed (Production)

```bash
DATABASE_URL=postgresql://... pnpm run db:seed
```

### 4. Start PM2

```bash
pnpm install -g pm2
pm2 start dist/main.js --name eiger-backend
pm2 save
pm2 startup
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.eiger.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Health Check

```bash
curl http://localhost:4000/api/health
```

## Monitoring

- Application logs: `pm2 logs eiger-backend`
- Monitor: `pm2 monitor`

````

### Step 9f: Create docs/DOCKER.md

```markdown
# Docker Setup Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

```bash
# Clone repository
git clone <repo-url>
cd backend

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f app
````

## Services

| Service  | Port | Description                    |
| -------- | ---- | ------------------------------ |
| app      | 4000 | NestJS application             |
| postgres | 5432 | PostgreSQL database            |
| redis    | 6379 | Redis cache/pubsub             |
| pgadmin  | 5050 | PostgreSQL admin UI (optional) |

## Development with Docker

### Hot Reload

The app container supports hot reload via volume mounting:

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

### Accessing Database

```bash
# Connect to PostgreSQL
docker exec -it eiger-backend_postgres_1 psql -U eiger -d eiger

# Run migrations
docker exec -it eiger-backend_app_1 pnpm run db:migrate

# Seed data
docker exec -it eiger-backend_app_1 pnpm run db:seed
```

### pgAdmin

1. Open http://localhost:5050
2. Login: `admin@eiger.com` / `admin123`
3. Add Server:
   - Host: `postgres`
   - Port: `5432`
   - Database: `eiger`
   - User: `eiger`
   - Password: `eiger_secret`

## Production Docker

For production, use `docker-compose.prod.yml`:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Postgres connection refused

```bash
# Check if postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### App fails to start

```bash
# Check app logs
docker-compose logs app

# Rebuild without cache
docker-compose build --no-cache app
```

### Redis connection refused

```bash
# Check redis status
docker-compose ps redis

# Restart redis
docker-compose restart redis
```

````

### Step 9g: Create docs/TESTING.md

```markdown
# Testing Guide

## Test Framework

- **Jest** - Testing framework
- **NestJS Testing** - Testing utilities

## Running Tests

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch

# Run specific test file
pnpm run test -- auth.service.spec.ts
````

## Writing Tests

### Service Test Example

```typescript
describe("ProductService", () => {
  let service: ProductService;
  let repository: ProductRepository;

  const mockRepository = {
    findAllActive: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: ProductRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get<ProductRepository>(ProductRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProducts", () => {
    it("should return active products", async () => {
      const mockProducts = [
        { id: "1", name: "Product 1", price: 100, isActive: true },
      ];
      mockRepository.findAllActive.mockResolvedValue(mockProducts);

      const result = await service.getProducts();

      expect(result).toEqual(mockProducts);
      expect(mockRepository.findAllActive).toHaveBeenCalled();
    });
  });
});
```

### Repository Test Example

```typescript
describe("ProductRepository", () => {
  let repository: ProductRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
    };

    repository = new ProductRepository(mockDb);
  });

  it("should find all active products", async () => {
    const mockProducts = [{ id: "1", name: "Product", is_active: 1 }];
    mockDb.limit.mockResolvedValue(mockProducts);

    const result = await repository.findAllActive();

    expect(result).toHaveLength(1);
    expect(result[0].isActive).toBe(true);
  });
});
```

## Coverage Requirements

| Category   | Minimum |
| ---------- | ------- |
| Statements | 70%     |
| Branches   | 60%     |
| Functions  | 70%     |
| Lines      | 70%     |

## Mock Patterns

### Database Mock

```typescript
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([]),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
};
```

### Redis Mock

```typescript
const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue("OK"),
  del: jest.fn().mockResolvedValue(1),
  quit: jest.fn().mockResolvedValue("OK"),
};
```

````

### Step 10: Verify Build

```bash
pnpm run build
````

### Step 7: Verify Tests

```bash
pnpm run test
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 14] Final Assembly - Package.json, README, Integration Test`
Labels: `backend`, `task-14`, `priority:P1`

### After Implementation - Create PR

```bash
git checkout -b task/14-final-assembly
git add -A
git commit -m "feat: final assembly - package.json, README, docs"
git push -u origin task/14-final-assembly
```

---

## 5. Verification Checklist

- [ ] package.json scripts correct
- [ ] .env.example created
- [ ] drizzle.config.ts created
- [ ] tsconfig.json updated
- [ ] README.md complete
- [ ] docker-compose.yml created
- [ ] Dockerfile created
- [ ] .dockerignore created
- [ ] docs/README.md created
- [ ] docs/ARCHITECTURE.md created
- [ ] docs/API.md created
- [ ] docs/DATABASE.md created
- [ ] docs/DEPLOYMENT.md created
- [ ] docs/DOCKER.md created
- [ ] docs/TESTING.md created
- [ ] Build successful
- [ ] Tests pass
- [ ] GitHub issue created
- [ ] PR created
