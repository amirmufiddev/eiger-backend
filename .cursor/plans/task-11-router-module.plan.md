---
name: task-11-router-module
overview: "Task 11: Router Module - Aggregate routes by role (admin/member)"
todos:
  - id: 1
    content: "Buat GitHub Issue untuk Task 11"
    status: pending
  - id: 2
    content: "Buat directory src/router/"
    status: pending
  - id: 3
    content: "Buat RoutesMemberModule"
    status: pending
  - id: 4
    content: "Buat RoutesAdminModule"
    status: pending
  - id: 5
    content: "Buat RouterModule"
    status: pending
  - id: 6
    content: "Update AppModule import RouterModule"
    status: pending
  - id: 7
    content: "Verify build successful"
    status: pending
  - id: 8
    content: "Buat PR ke branch task/11-router-module"
    status: pending
isProject: false
---

# Plan: Task 11 - Router Module

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Buat GitHub Issue untuk task ini | `issue_write` MCP tool |
| 2 | Implementasi Router module | `/executing-plans` |
| 3 | Buat PR setelah selesai | `/finishing-a-development-branch` |

### Fase 1 - Create GitHub Issue

Gunakan `issue_write` tool dari `user-github-mcp-server` MCP:

```
method: "create"
owner: "amirmufiddev"
repo: "eiger-backend"
title: "[Task 11] Router Module - Aggregate Routes by Role"
body: (isi overview)
labels: ["backend", "task-11", "priority:P1"]
```

Catatan: Pastikan read tool schema `issue_write.json` terlebih dahulu sebelum调用.

---

## 1. Overview

Router module untuk aggregate semua routes berdasarkan role. Admin routes di-separate dari member routes.

---

## 2. Files to Create

```
backend/src/router/
├── router.module.ts
└── routes/
    ├── routes.admin.module.ts
    └── routes.member.module.ts
```

---

## 3. Implementation

### Step 1: Create RoutesMemberModule

```typescript
// src/router/routes/routes.member.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { ProductModule } from '../../modules/product/product.module';
import { PaymentMethodModule } from '../../modules/payment-method/payment-method.module';
import { MembershipModule } from '../../modules/membership/membership.module';
import { WalletModule } from '../../modules/wallet/wallet.module';
import { TransactionModule } from '../../modules/transaction/transaction.module';

@Module({
  imports: [
    AuthModule,
    ProductModule,
    PaymentMethodModule,
    MembershipModule,
    WalletModule,
    TransactionModule,
  ],
})
export class RoutesMemberModule {}
```

### Step 2: Create RoutesAdminModule

```typescript
// src/router/routes/routes.admin.module.ts
import { Module } from '@nestjs/common';
import { ProductModule } from '../../modules/product/product.module';
import { PaymentMethodModule } from '../../modules/payment-method/payment-method.module';
import { MembershipModule } from '../../modules/membership/membership.module';
import { WalletModule } from '../../modules/wallet/wallet.module';
import { TransactionModule } from '../../modules/transaction/transaction.module';
import { ReportModule } from '../../modules/report/report.module';

@Module({
  imports: [
    ProductModule,
    PaymentMethodModule,
    MembershipModule,
    WalletModule,
    TransactionModule,
    ReportModule,
  ],
})
export class RoutesAdminModule {}
```

### Step 3: Create RouterModule

```typescript
// src/router/router.module.ts
import { Module } from '@nestjs/common';
import { RoutesMemberModule } from './routes/routes.member.module';
import { RoutesAdminModule } from './routes/routes.admin.module';

@Module({
  imports: [RoutesMemberModule, RoutesAdminModule],
  exports: [RoutesMemberModule, RoutesAdminModule],
})
export class RouterModule {}
```

### Step 4: Update AppModule

```typescript
// src/app.module.ts (update imports)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { RouterModule } from './router/router.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    RouterModule,
  ],
})
export class AppModule {}
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 11] Router Module - Aggregate Routes by Role`
Labels: `backend`, `task-11`, `priority:P1`

### After Implementation - Create PR

```bash
git checkout -b task/11-router-module
git add -A
git commit -m "feat: implement router module"
git push -u origin task/11-router-module
```

---

## 5. Verification Checklist

- [ ] RoutesMemberModule imports all member controllers
- [ ] RoutesAdminModule imports all admin controllers
- [ ] RouterModule aggregates both
- [ ] Build successful
- [ ] GitHub issue created
- [ ] PR created
