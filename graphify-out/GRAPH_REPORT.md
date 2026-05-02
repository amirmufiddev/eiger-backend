# Graph Report - /home/amirmufid/amir-dev/eiger/eiger-backend  (2026-05-02)

## Corpus Check
- Corpus is ~7,750 words - fits in a single context window. You may not need a graph.

## Summary
- 94 nodes · 84 edges · 20 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_EAL Business Domain|EAL Business Domain]]
- [[_COMMUNITY_Error Handling & Logging|Error Handling & Logging]]
- [[_COMMUNITY_Infrastructure Module|Infrastructure Module]]
- [[_COMMUNITY_Application Bootstrap & Security|Application Bootstrap & Security]]
- [[_COMMUNITY_Redis Service|Redis Service]]
- [[_COMMUNITY_Database Seeding|Database Seeding]]
- [[_COMMUNITY_App Controller|App Controller]]
- [[_COMMUNITY_WebSocket Adapter|WebSocket Adapter]]
- [[_COMMUNITY_App Service|App Service]]
- [[_COMMUNITY_Logging Interceptor|Logging Interceptor]]
- [[_COMMUNITY_Environment Validation|Environment Validation]]
- [[_COMMUNITY_App Module|App Module]]
- [[_COMMUNITY_Database Module|Database Module]]
- [[_COMMUNITY_Logger Module|Logger Module]]
- [[_COMMUNITY_Users Relations|Users Relations]]
- [[_COMMUNITY_Wallets Relations|Wallets Relations]]
- [[_COMMUNITY_Memberships Relations|Memberships Relations]]
- [[_COMMUNITY_Transactions Relations|Transactions Relations]]
- [[_COMMUNITY_Transaction Items Relations|Transaction Items Relations]]
- [[_COMMUNITY_Seed Function|Seed Function]]

## God Nodes (most connected - your core abstractions)
1. `Eiger Adventure Land PRD` - 10 edges
2. `AppLoggerService` - 9 edges
3. `AppModule` - 7 edges
4. `bootstrap function` - 7 edges
5. `users table` - 5 edges
6. `RedisService` - 4 edges
7. `transactions table` - 4 edges
8. `RedisModule` - 4 edges
9. `Atomic Checkout Transaction` - 4 edges
10. `Fastify Adapter` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Role-Based Access Control (RBAC)` --conceptually_related_to--> `users table`  [INFERRED]
  prd_eiger.md → src/infrastructure/database/schema.ts
- `Atomic Checkout Transaction` --conceptually_related_to--> `memberships table`  [INFERRED]
  prd_eiger.md → src/infrastructure/database/schema.ts
- `Membership & Points System` --references--> `memberships table`  [INFERRED]
  prd_eiger.md → src/infrastructure/database/schema.ts
- `Atomic Checkout Transaction` --conceptually_related_to--> `wallets table`  [INFERRED]
  prd_eiger.md → src/infrastructure/database/schema.ts
- `E-Wallet System` --references--> `wallets table`  [INFERRED]
  prd_eiger.md → src/infrastructure/database/schema.ts

## Hyperedges (group relationships)
- **EAL Core Database Schema** — schema_users, schema_sessions, schema_memberships, schema_wallets, schema_products, schema_payment_methods, schema_transactions, schema_transaction_items [EXTRACTED 1.00]
- **EAL Backend Infrastructure Stack** — database_module, redis_module, logger_module, env_validation [EXTRACTED 1.00]
- **EAL Global Middleware Stack** — all_exceptions_filter, logging_interceptor, websocket_adapter, app_logger_service [EXTRACTED 1.00]

## Communities

### Community 0 - "EAL Business Domain"
Cohesion: 0.15
Nodes (17): AppController, AppService, Atomic Checkout Transaction, Cashless & Single-Identity Pass System, E-Wallet System, Dynamic QR Code Tickets, Membership & Points System, Eiger Adventure Land PRD (+9 more)

### Community 1 - "Error Handling & Logging"
Cohesion: 0.17
Nodes (2): AllExceptionsFilter, AppLoggerService

### Community 2 - "Infrastructure Module"
Cohesion: 0.2
Nodes (11): AppModule, database config, DATABASE_CONNECTION, DatabaseModule, validateEnv function, LoggerModule, REDIS_CLIENT, redis config (+3 more)

### Community 3 - "Application Bootstrap & Security"
Cohesion: 0.39
Nodes (8): AllExceptionsFilter, AppLoggerService, bootstrap function, Fastify Adapter, LoggingInterceptor, Security Middleware Stack, WebSocketAdapter, Winston Structured Logging

### Community 4 - "Redis Service"
Cohesion: 0.33
Nodes (2): RedisModule, RedisService

### Community 5 - "Database Seeding"
Cohesion: 0.4
Nodes (2): seed(), bootstrap()

### Community 6 - "App Controller"
Cohesion: 0.5
Nodes (1): AppController

### Community 7 - "WebSocket Adapter"
Cohesion: 0.5
Nodes (1): WebSocketAdapter

### Community 8 - "App Service"
Cohesion: 0.67
Nodes (1): AppService

### Community 9 - "Logging Interceptor"
Cohesion: 0.67
Nodes (1): LoggingInterceptor

### Community 10 - "Environment Validation"
Cohesion: 0.67
Nodes (1): EnvironmentVariables

### Community 11 - "App Module"
Cohesion: 1.0
Nodes (1): AppModule

### Community 12 - "Database Module"
Cohesion: 1.0
Nodes (1): DatabaseModule

### Community 13 - "Logger Module"
Cohesion: 1.0
Nodes (1): LoggerModule

### Community 20 - "Users Relations"
Cohesion: 1.0
Nodes (1): users relations

### Community 21 - "Wallets Relations"
Cohesion: 1.0
Nodes (1): wallets relations

### Community 22 - "Memberships Relations"
Cohesion: 1.0
Nodes (1): memberships relations

### Community 23 - "Transactions Relations"
Cohesion: 1.0
Nodes (1): transactions relations

### Community 24 - "Transaction Items Relations"
Cohesion: 1.0
Nodes (1): transaction_items relations

### Community 25 - "Seed Function"
Cohesion: 1.0
Nodes (1): seed function

## Knowledge Gaps
- **21 isolated node(s):** `AppModule`, `DatabaseModule`, `RedisModule`, `LoggerModule`, `EnvironmentVariables` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Error Handling & Logging`** (12 nodes): `AllExceptionsFilter`, `.catch()`, `AppLoggerService`, `.constructor()`, `.debug()`, `.error()`, `.forRoot()`, `.getLogger()`, `.verbose()`, `.warn()`, `all-exceptions.filter.ts`, `logger.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Redis Service`** (6 nodes): `RedisModule`, `RedisService`, `.constructor()`, `.getClient()`, `.onModuleDestroy()`, `redis.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Seeding`** (5 nodes): `seed()`, `.log()`, `seed.ts`, `bootstrap()`, `main.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Controller`** (4 nodes): `AppController`, `.constructor()`, `.getHello()`, `app.controller.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WebSocket Adapter`** (4 nodes): `WebSocketAdapter`, `.constructor()`, `.createIOServer()`, `websocket.adapter.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Service`** (3 nodes): `AppService`, `.getHello()`, `app.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Logging Interceptor`** (3 nodes): `LoggingInterceptor`, `.intercept()`, `logging.interceptor.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Environment Validation`** (3 nodes): `EnvironmentVariables`, `validateEnv()`, `env.validation.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Module`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Module`** (2 nodes): `DatabaseModule`, `database.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Logger Module`** (2 nodes): `LoggerModule`, `logger.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Users Relations`** (1 nodes): `users relations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Wallets Relations`** (1 nodes): `wallets relations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Memberships Relations`** (1 nodes): `memberships relations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Transactions Relations`** (1 nodes): `transactions relations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Transaction Items Relations`** (1 nodes): `transaction_items relations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Seed Function`** (1 nodes): `seed function`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Eiger Adventure Land PRD` connect `EAL Business Domain` to `Infrastructure Module`, `Application Bootstrap & Security`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `AppModule` connect `Infrastructure Module` to `Application Bootstrap & Security`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `bootstrap function` connect `Application Bootstrap & Security` to `Infrastructure Module`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `AppModule`, `DatabaseModule`, `RedisModule` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._