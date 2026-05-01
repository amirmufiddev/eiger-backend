---
name: task-09-transaction-module
overview: "Task 9: Transaction Module - Checkout, Payment, Transaction History"
todos: []
isProject: false
---

# Plan: Task 09 - Transaction Module

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Buat GitHub Issue untuk task ini | `/github-mcp-server` |
| 2 | Implementasi Transaction module | `/executing-plans` |
| 3 | Buat PR setelah selesai | `/finishing-a-development-branch` |

---

## 1. Overview

Transaction module untuk checkout, payment, dan history. Semua transaksi dilakukan dalam database transaction untuk konsistensi.

---

## 2. Files to Create

```
backend/src/modules/transaction/
├── transaction.module.ts
├── repository/
│   └── transaction.repository.ts
├── services/
│   └── transaction.service.ts
├── controllers/
│   ├── transaction.admin.controller.ts
│   └── transaction.member.controller.ts
└── dto/
    ├── index.ts
    ├── request/
    │   └── checkout.dto.ts
    └── response/
        └── transaction.response.dto.ts
```

---

## 3. Implementation

### Step 1: Create TransactionRepository

```typescript
// src/modules/transaction/repository/transaction.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../infrastructure/database/database.module';
import {
  transactions,
  transactionItems,
  products,
  wallets,
} from '../../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../../infrastructure/database/schema';

export interface TransactionEntity {
  id: string;
  userId: string;
  paymentMethodId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  total: number;
  createdAt: Date;
}

export interface TransactionItemEntity {
  id: string;
  transactionId: string;
  productId: string;
  qty: number;
  unitPrice: number;
}

export interface CheckoutItem {
  productId: string;
  qty: number;
}

@Injectable()
export class TransactionRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  private mapTransaction(t: typeof transactions.$inferSelect): TransactionEntity {
    return {
      id: t.id,
      userId: t.userId,
      paymentMethodId: t.paymentMethodId,
      status: t.status as TransactionEntity['status'],
      total: parseFloat(t.total),
      createdAt: t.createdAt,
    };
  }

  async findByUserId(userId: string): Promise<TransactionEntity[]> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(transactions.createdAt);
    return result.map((t) => this.mapTransaction(t));
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    return result.length > 0 ? this.mapTransaction(result[0]) : null;
  }

  async findAll(): Promise<TransactionEntity[]> {
    const result = await this.db.select().from(transactions).orderBy(transactions.createdAt);
    return result.map((t) => this.mapTransaction(t));
  }

  async createTransaction(
    userId: string,
    paymentMethodId: string,
    total: number,
    items: CheckoutItem[],
  ): Promise<TransactionEntity> {
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { default: postgres } = await import('postgres');

    const connectionString = process.env.DATABASE_URL!;
    const client = postgres(connectionString);
    const db = drizzle(client, { schema });

    const [txResult] = await db
      .insert(transactions)
      .values({ userId, paymentMethodId, total: total.toString(), status: 'pending' })
      .returning();

    for (const item of items) {
      const productResult = await this.db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (productResult.length > 0) {
        await db.insert(transactionItems).values({
          transactionId: txResult.id,
          productId: item.productId,
          qty: item.qty,
          unitPrice: productResult[0].price,
        });
      }
    }

    await client.end();
    return this.mapTransaction(txResult);
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'completed' | 'failed' | 'cancelled',
  ): Promise<TransactionEntity | null> {
    const [result] = await this.db
      .update(transactions)
      .set({ status, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return result ? this.mapTransaction(result) : null;
  }
}
```

### Step 2: Create TransactionService

```typescript
// src/modules/transaction/services/transaction.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../infrastructure/database/database.module';
import {
  wallets,
  products,
  memberships,
} from '../../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../../infrastructure/database/schema';
import {
  TransactionRepository,
  TransactionEntity,
  CheckoutItem,
} from '../repository/transaction.repository';

@Injectable()
export class TransactionService {
  constructor(
    private readonly repository: TransactionRepository,
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async checkout(
    userId: string,
    paymentMethodId: string,
    items: CheckoutItem[],
  ): Promise<TransactionEntity> {
    let total = 0;
    for (const item of items) {
      const product = await this.db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product.length === 0) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      total += parseFloat(product[0].price) * item.qty;
    }

    const wallet = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (wallet.length === 0 || parseFloat(wallet[0].balance) < total) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const transaction = await this.repository.createTransaction(
      userId,
      paymentMethodId,
      total,
      items,
    );

    const newBalance = parseFloat(wallet[0].balance) - total;
    await this.db
      .update(wallets)
      .set({ balance: newBalance.toString(), updatedAt: new Date() })
      .where(eq(wallets.userId, userId));

    await this.db
      .update(memberships)
      .set({
        points: wallet[0].id,
        updatedAt: new Date(),
      })
      .where(eq(memberships.userId, userId));

    return this.repository.updateStatus(transaction.id, 'completed') as Promise<TransactionEntity>;
  }

  async getUserTransactions(userId: string): Promise<TransactionEntity[]> {
    return this.repository.findByUserId(userId);
  }

  async getAllTransactions(): Promise<TransactionEntity[]> {
    return this.repository.findAll();
  }

  async getTransactionById(id: string): Promise<TransactionEntity> {
    const tx = await this.repository.findById(id);
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async cancelTransaction(id: string, userId: string): Promise<TransactionEntity> {
    const tx = await this.repository.findById(id);
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.userId !== userId) throw new BadRequestException('Cannot cancel another user transaction');
    if (tx.status !== 'pending') throw new BadRequestException('Can only cancel pending transactions');

    return (await this.repository.updateStatus(id, 'cancelled')) as TransactionEntity;
  }
}
```

### Step 3: Create DTOs

```typescript
// src/modules/transaction/dto/request/checkout.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  qty: number;
}

export class CheckoutRequestDto {
  @ApiProperty()
  @IsString()
  paymentMethodId: string;

  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}
```

```typescript
// src/modules/transaction/dto/response/transaction.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  qty: number;

  @ApiProperty()
  unitPrice: number;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  paymentMethodId: string;

  @ApiProperty({ enum: ['pending', 'completed', 'failed', 'cancelled'] })
  status: 'pending' | 'completed' | 'failed' | 'cancelled';

  @ApiProperty()
  total: number;

  @ApiProperty()
  createdAt: Date;
}

export class TransactionWithItemsResponseDto extends TransactionResponseDto {
  @ApiPropertyOptional({ type: [TransactionItemResponseDto] })
  items?: TransactionItemResponseDto[];
}
```

```typescript
// src/modules/transaction/dto/index.ts
export * from './request/checkout.dto';
export * from './response/transaction.response.dto';
```

### Step 4: Create MemberController

```typescript
// src/modules/transaction/controllers/transaction.member.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';
import {
  CheckoutRequestDto,
  TransactionResponseDto,
} from '../dto';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TransactionMemberController {
  constructor(private readonly service: TransactionService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout and pay' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  async checkout(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CheckoutRequestDto,
  ): Promise<TransactionResponseDto> {
    return this.service.checkout(
      user.id,
      dto.paymentMethodId,
      dto.items,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async getHistory(@CurrentUser() user: CurrentUserData): Promise<TransactionResponseDto[]> {
    return this.service.getUserTransactions(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async getById(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    const tx = await this.service.getTransactionById(id);
    if (tx.userId !== user.id) {
      throw new Error('Access denied');
    }
    return tx;
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel pending transaction' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async cancel(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    return this.service.cancelTransaction(id, user.id);
  }
}
```

### Step 5: Create AdminController

```typescript
// src/modules/transaction/controllers/transaction.admin.controller.ts
import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { TransactionResponseDto } from '../dto';

@ApiTags('Admin - Transactions')
@Controller('admin/transactions')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class TransactionAdminController {
  constructor(private readonly service: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async getAll(): Promise<TransactionResponseDto[]> {
    return this.service.getAllTransactions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async getById(@Param('id') id: string): Promise<TransactionResponseDto> {
    return this.service.getTransactionById(id);
  }
}
```

### Step 6: Create Module

```typescript
// src/modules/transaction/transaction.module.ts
import { Module } from '@nestjs/common';
import { TransactionRepository } from './repository/transaction.repository';
import { TransactionService } from './services/transaction.service';
import { TransactionMemberController } from './controllers/transaction.member.controller';
import { TransactionAdminController } from './controllers/transaction.admin.controller';

@Module({
  controllers: [TransactionMemberController, TransactionAdminController],
  providers: [TransactionRepository, TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 09] Transaction Module - Checkout & Payment`
Labels: `backend`, `task-09`, `priority:P1`

### After Implementation - Create PR

```bash
git checkout -b task/09-transaction-module
git add -A
git commit -m "feat: implement transaction module with checkout"
git push -u origin task/09-transaction-module
```

---

## 5. Verification Checklist

- [ ] Member can checkout
- [ ] Balance deducted on checkout
- [ ] Points added to membership
- [ ] Member can view transaction history
- [ ] Member can cancel pending transaction
- [ ] Admin can view all transactions
- [ ] Swagger docs updated
- [ ] Build successful
- [ ] GitHub issue created
- [ ] PR created
