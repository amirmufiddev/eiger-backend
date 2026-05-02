---
name: task-10-report-module
overview: "Task 10: Report Module - Revenue, Transaction, Membership Reports"
todos:
  - id: 1
    content: "Buat GitHub Issue untuk Task 10"
    status: pending
  - id: 2
    content: "Buat directory src/modules/report/"
    status: pending
  - id: 3
    content: "Buat ReportService"
    status: pending
  - id: 4
    content: "Buat DTOs (RevenueReport, TransactionReport, MembershipReport)"
    status: pending
  - id: 5
    content: "Buat ReportAdminController"
    status: pending
  - id: 6
    content: "Buat ReportModule"
    status: pending
  - id: 7
    content: "Update AppModule import ReportModule"
    status: pending
  - id: 8
    content: "Verify build successful"
    status: pending
  - id: 9
    content: "Buat PR ke branch task/10-report-module"
    status: pending
isProject: false
---

# Plan: Task 10 - Report Module

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Buat GitHub Issue untuk task ini | `issue_write` MCP tool |
| 2 | Implementasi Report module | `/executing-plans` |
| 3 | Buat PR setelah selesai | `/finishing-a-development-branch` |

### Fase 1 - Create GitHub Issue

Gunakan `issue_write` tool dari `user-github-mcp-server` MCP:

```
method: "create"
owner: "amirmufiddev"
repo: "eiger-backend"
title: "[Task 10] Report Module - Revenue, Transaction, Membership Reports"
body: (isi overview)
labels: ["backend", "task-10", "priority:P1"]
```

Catatan: Pastikan read tool schema `issue_write.json` terlebih dahulu sebelum调用.

---

## 1. Overview

Report module untuk generate laporan: revenue, transaction summary, membership stats. Admin only.

---

## 2. Files to Create

```
backend/src/modules/report/
├── report.module.ts
├── services/
│   └── report.service.ts
├── controllers/
│   └── report.admin.controller.ts
└── dto/
    ├── index.ts
    └── response/
        ├── revenue-report.dto.ts
        ├── transaction-report.dto.ts
        └── membership-report.dto.ts
```

---

## 3. Implementation

### Step 1: Create ReportService

```typescript
// src/modules/report/services/report.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../infrastructure/database/database.module';
import {
  transactions,
  transactionItems,
  products,
  users,
  memberships,
  wallets,
} from '../../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../../infrastructure/database/schema';

export interface RevenueReport {
  period: { start: Date; end: Date };
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  topProducts: { name: string; revenue: number; qty: number }[];
}

export interface TransactionReport {
  period: { start: Date; end: Date };
  totalTransactions: number;
  completed: number;
  pending: number;
  cancelled: number;
  failed: number;
  byPaymentMethod: { method: string; count: number }[];
}

export interface MembershipReport {
  totalMembers: number;
  byTier: { tier: string; count: number }[];
  topMembers: { name: string; email: string; points: number }[];
}

@Injectable()
export class ReportService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getRevenueReport(startDate: Date, endDate: Date): Promise<RevenueReport> {
    const txResult = await this.db
      .select({
        total: sql<string>`sum(${transactions.total})`,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate),
        ),
      );

    const completedResult = await this.db
      .select({
        productName: products.name,
        revenue: sql<string>`sum(${transactionItems.unitPrice} * ${transactionItems.qty})`,
        qty: sql<number>`sum(${transactionItems.qty})`,
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .where(
        and(
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate),
        ),
      )
      .groupBy(products.name)
      .orderBy(sql`sum desc`)
      .limit(10);

    const totalRevenue = txResult[0]?.total ? parseFloat(txResult[0].total) : 0;
    const transactionCount = txResult[0]?.count || 0;

    return {
      period: { start: startDate, end: endDate },
      totalRevenue,
      transactionCount,
      averageTransactionValue: transactionCount > 0 ? totalRevenue / transactionCount : 0,
      topProducts: completedResult.map((r) => ({
        name: r.productName,
        revenue: parseFloat(r.revenue),
        qty: Number(r.qty),
      })),
    };
  }

  async getTransactionReport(startDate: Date, endDate: Date): Promise<TransactionReport> {
    const statusCounts = await this.db
      .select({
        status: transactions.status,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate),
        ),
      )
      .groupBy(transactions.status);

    const statusMap: Record<string, number> = {
      completed: 0,
      pending: 0,
      cancelled: 0,
      failed: 0,
    };
    for (const s of statusCounts) {
      statusMap[s.status] = s.count;
    }

    const paymentMethodCounts = await this.db
      .select({
        paymentMethodId: transactions.paymentMethodId,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate),
        ),
      )
      .groupBy(transactions.paymentMethodId);

    const totalTransactions = Object.values(statusMap).reduce((a, b) => a + b, 0);

    return {
      period: { start: startDate, end: endDate },
      totalTransactions,
      completed: statusMap.completed,
      pending: statusMap.pending,
      cancelled: statusMap.cancelled,
      failed: statusMap.failed,
      byPaymentMethod: paymentMethodCounts.map((pm) => ({
        method: pm.paymentMethodId,
        count: Number(pm.count),
      })),
    };
  }

  async getMembershipReport(): Promise<MembershipReport> {
    const tierCounts = await this.db
      .select({
        tier: memberships.tier,
        count: sql<number>`count(*)`,
      })
      .from(memberships)
      .groupBy(memberships.tier);

    const topMembers = await this.db
      .select({
        name: users.name,
        email: users.email,
        points: memberships.points,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .orderBy(sql`${memberships.points} desc`)
      .limit(10);

    const totalMembers = tierCounts.reduce((sum, t) => sum + Number(t.count), 0);

    return {
      totalMembers,
      byTier: tierCounts.map((t) => ({
        tier: t.tier,
        count: Number(t.count),
      })),
      topMembers: topMembers.map((m) => ({
        name: m.name || 'Unknown',
        email: m.email,
        points: Number(m.points),
      })),
    };
  }
}
```

### Step 2: Create DTOs

```typescript
// src/modules/report/dto/response/revenue-report.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TopProductDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  qty: number;
}

export class RevenueReportResponseDto {
  @ApiProperty()
  period: { start: Date; end: Date };

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  transactionCount: number;

  @ApiProperty()
  averageTransactionValue: number;

  @ApiProperty({ type: [TopProductDto] })
  topProducts: TopProductDto[];
}
```

```typescript
// src/modules/report/dto/response/transaction-report.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaymentMethodCountDto {
  @ApiProperty()
  method: string;

  @ApiProperty()
  count: number;
}

export class TransactionReportResponseDto {
  @ApiProperty()
  period: { start: Date; end: Date };

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  cancelled: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ type: [PaymentMethodCountDto] })
  byPaymentMethod: PaymentMethodCountDto[];
}
```

```typescript
// src/modules/report/dto/response/membership-report.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TierCountDto {
  @ApiProperty()
  tier: string;

  @ApiProperty()
  count: number;
}

export class TopMemberDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  points: number;
}

export class MembershipReportResponseDto {
  @ApiProperty()
  totalMembers: number;

  @ApiProperty({ type: [TierCountDto] })
  byTier: TierCountDto[];

  @ApiProperty({ type: [TopMemberDto] })
  topMembers: TopMemberDto[];
}
```

```typescript
// src/modules/report/dto/index.ts
export * from './response/revenue-report.dto';
export * from './response/transaction-report.dto';
export * from './response/membership-report.dto';
```

### Step 3: Create AdminController

```typescript
// src/modules/report/controllers/report.admin.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  RevenueReportResponseDto,
  TransactionReportResponseDto,
  MembershipReportResponseDto,
} from '../dto';

@ApiTags('Admin - Reports')
@Controller('admin/reports')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class ReportAdminController {
  constructor(private readonly service: ReportService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, type: RevenueReportResponseDto })
  async getRevenueReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<RevenueReportResponseDto> {
    return this.service.getRevenueReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, type: TransactionReportResponseDto })
  async getTransactionReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<TransactionReportResponseDto> {
    return this.service.getTransactionReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('membership')
  @ApiOperation({ summary: 'Get membership report' })
  @ApiResponse({ status: 200, type: MembershipReportResponseDto })
  async getMembershipReport(): Promise<MembershipReportResponseDto> {
    return this.service.getMembershipReport();
  }
}
```

### Step 4: Create Module

```typescript
// src/modules/report/report.module.ts
import { Module } from '@nestjs/common';
import { ReportService } from './services/report.service';
import { ReportAdminController } from './controllers/report.admin.controller';

@Module({
  controllers: [ReportAdminController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 10] Report Module - Revenue, Transaction, Membership Reports`
Labels: `backend`, `task-10`, `priority:P2`

### After Implementation - Create PR

```bash
git checkout -b task/10-report-module
git add -A
git commit -m "feat: implement report module"
git push -u origin task/10-report-module
```

---

## 5. Verification Checklist

- [ ] Revenue report works
- [ ] Transaction report works
- [ ] Membership report works
- [ ] Swagger docs updated
- [ ] Build successful
- [ ] GitHub issue created
- [ ] PR created
