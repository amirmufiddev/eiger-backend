---
name: task-06-payment-method-module
overview: "Task 6: Payment Method Module - Repository, Service, Admin/Member Controllers"
todos: []
isProject: false
---

# Plan: Task 06 - Payment Method Module

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Buat GitHub Issue untuk task ini | `/github-mcp-server` |
| 2 | Implementasi Payment Method module | `/executing-plans` |
| 3 | Buat PR setelah selesai | `/finishing-a-development-branch` |

---

## 1. Overview

Payment Method module dengan repository pattern. Member bisa GET active payment methods, Admin bisa CRUD.

---

## 2. Files to Create

```
backend/src/modules/payment-method/
├── payment-method.module.ts
├── repository/
│   └── payment-method.repository.ts
├── services/
│   └── payment-method.service.ts
├── controllers/
│   ├── payment-method.admin.controller.ts
│   └── payment-method.member.controller.ts
└── dto/
    ├── index.ts
    ├── request/
    │   ├── create-payment-method.dto.ts
    │   └── update-payment-method.dto.ts
    └── response/
        └── payment-method.response.dto.ts
```

---

## 3. Implementation

### Step 1: Create PaymentMethodRepository

```typescript
// src/modules/payment-method/repository/payment-method.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../infrastructure/database/database.module';
import { paymentMethods } from '../../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../../infrastructure/database/schema';

export interface PaymentMethodEntity {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreatePaymentMethodData {
  code: string;
  name: string;
}

export interface UpdatePaymentMethodData {
  name?: string;
  isActive?: boolean;
}

@Injectable()
export class PaymentMethodRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  private mapToEntity(p: typeof paymentMethods.$inferSelect): PaymentMethodEntity {
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      isActive: p.isActive === 1,
    };
  }

  async findAllActive(): Promise<PaymentMethodEntity[]> {
    const result = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, 1));
    return result.map((p) => this.mapToEntity(p));
  }

  async findById(id: string): Promise<PaymentMethodEntity | null> {
    const result = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .limit(1);
    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findByCode(code: string): Promise<PaymentMethodEntity | null> {
    const result = await this.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.code, code))
      .limit(1);
    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findAll(): Promise<PaymentMethodEntity[]> {
    const result = await this.db.select().from(paymentMethods);
    return result.map((p) => this.mapToEntity(p));
  }

  async create(data: CreatePaymentMethodData): Promise<PaymentMethodEntity> {
    const [result] = await this.db
      .insert(paymentMethods)
      .values(data)
      .returning();
    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethodEntity | null> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0;

    const [result] = await this.db
      .update(paymentMethods)
      .set(updateData)
      .where(eq(paymentMethods.id, id))
      .returning();
    return result ? this.mapToEntity(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    return true;
  }
}
```

### Step 2: Create PaymentMethodService

```typescript
// src/modules/payment-method/services/payment-method.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaymentMethodRepository,
  PaymentMethodEntity,
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
} from '../repository/payment-method.repository';

@Injectable()
export class PaymentMethodService {
  constructor(private readonly repository: PaymentMethodRepository) {}

  async getActivePaymentMethods(): Promise<PaymentMethodEntity[]> {
    return this.repository.findAllActive();
  }

  async getAllPaymentMethods(): Promise<PaymentMethodEntity[]> {
    return this.repository.findAll();
  }

  async getPaymentMethodById(id: string): Promise<PaymentMethodEntity> {
    const method = await this.repository.findById(id);
    if (!method) throw new NotFoundException('Payment method not found');
    return method;
  }

  async create(data: CreatePaymentMethodData): Promise<PaymentMethodEntity> {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethodEntity> {
    const result = await this.repository.update(id, data);
    if (!result) throw new NotFoundException('Payment method not found');
    return result;
  }

  async delete(id: string): Promise<{ message: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Payment method not found');
    await this.repository.delete(id);
    return { message: 'Payment method deleted' };
  }
}
```

### Step 3: Create DTOs

```typescript
// src/modules/payment-method/dto/request/create-payment-method.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreatePaymentMethodRequestDto {
  @ApiProperty({ example: 'EWALLET' })
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiProperty({ example: 'E-Wallet' })
  @IsString()
  @Length(1, 255)
  name: string;
}
```

```typescript
// src/modules/payment-method/dto/request/update-payment-method.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, Length } from 'class-validator';

export class UpdatePaymentMethodRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

```typescript
// src/modules/payment-method/dto/response/payment-method.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentMethodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isActive: boolean;
}
```

```typescript
// src/modules/payment-method/dto/index.ts
export * from './request/create-payment-method.dto';
export * from './request/update-payment-method.dto';
export * from './response/payment-method.response.dto';
```

### Step 4: Create MemberController

```typescript
// src/modules/payment-method/controllers/payment-method.member.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentMethodService } from '../services/payment-method.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PaymentMethodResponseDto } from '../dto';

@ApiTags('Payment Methods')
@Controller('payment-methods')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PaymentMethodMemberController {
  constructor(private readonly service: PaymentMethodService) {}

  @Get()
  @ApiOperation({ summary: 'Get active payment methods' })
  @ApiResponse({ status: 200, type: [PaymentMethodResponseDto] })
  async getPaymentMethods(): Promise<PaymentMethodResponseDto[]> {
    return this.service.getActivePaymentMethods();
  }
}
```

### Step 5: Create AdminController

```typescript
// src/modules/payment-method/controllers/payment-method.admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { PaymentMethodService } from '../services/payment-method.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CreatePaymentMethodRequestDto,
  UpdatePaymentMethodRequestDto,
  PaymentMethodResponseDto,
} from '../dto';

@ApiTags('Admin - Payment Methods')
@Controller('admin/payment-methods')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class PaymentMethodAdminController {
  constructor(private readonly service: PaymentMethodService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment methods' })
  @ApiResponse({ status: 200, type: [PaymentMethodResponseDto] })
  async getAll() {
    return this.service.getAllPaymentMethods();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment method by ID' })
  @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
  async getById(@Param('id') id: string) {
    return this.service.getPaymentMethodById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create payment method' })
  @ApiResponse({ status: 201, type: PaymentMethodResponseDto })
  async create(@Body() dto: CreatePaymentMethodRequestDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment method' })
  @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodRequestDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment method' })
  @ApiResponse({ status: 200, description: 'Payment method deleted' })
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
```

### Step 6: Create Module

```typescript
// src/modules/payment-method/payment-method.module.ts
import { Module } from '@nestjs/common';
import { PaymentMethodRepository } from './repository/payment-method.repository';
import { PaymentMethodService } from './services/payment-method.service';
import { PaymentMethodMemberController } from './controllers/payment-method.member.controller';
import { PaymentMethodAdminController } from './controllers/payment-method.admin.controller';

@Module({
  controllers: [PaymentMethodMemberController, PaymentMethodAdminController],
  providers: [PaymentMethodRepository, PaymentMethodService],
  exports: [PaymentMethodService],
})
export class PaymentMethodModule {}
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 06] Payment Method Module - CRUD`
Labels: `backend`, `task-06`, `priority:P1`

### After Implementation - Create PR

```bash
git checkout -b task/06-payment-method-module
git add -A
git commit -m "feat: implement payment method module"
git push -u origin task/06-payment-method-module
```

---

## 5. Verification Checklist

- [ ] Member can GET active payment methods
- [ ] Admin can CRUD payment methods
- [ ] Swagger docs updated
- [ ] Build successful
- [ ] GitHub issue created
- [ ] PR created
