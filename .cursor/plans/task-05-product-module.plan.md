---
name: task-05-product-module
overview: "Task 5: Product Module - Repository, Service, Admin/Member Controllers"
todos:
  - id: 1
    content: "Buat GitHub Issue untuk Task 05"
    status: pending
  - id: 2
    content: "Buat directory src/modules/product/"
    status: pending
  - id: 3
    content: "Buat ProductRepository"
    status: pending
  - id: 4
    content: "Buat ProductService"
    status: pending
  - id: 5
    content: "Buat DTOs (CreateProduct, UpdateProduct)"
    status: pending
  - id: 6
    content: "Buat ProductAdminController"
    status: pending
  - id: 7
    content: "Buat ProductMemberController"
    status: pending
  - id: 8
    content: "Buat ProductModule"
    status: pending
  - id: 9
    content: "Update AppModule import ProductModule"
    status: pending
  - id: 10
    content: "Verify build successful"
    status: pending
  - id: 11
    content: "Buat PR ke branch task/05-product-module"
    status: pending
isProject: false
---

# Plan: Task 05 - Product Module

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Buat GitHub Issue untuk task ini | `issue_write` MCP tool |
| 2 | Implementasi Product module | `/executing-plans` |
| 3 | Buat PR setelah selesai | `/finishing-a-development-branch` |

### Fase 1 - Create GitHub Issue

Gunakan `issue_write` tool dari `user-github-mcp-server` MCP:

```
method: "create"
owner: "amirmufiddev"
repo: "eiger-backend"
title: "[Task 05] Product Module - Repository, Service, Admin/Member Controllers"
body: (isi overview)
labels: ["backend", "task-05", "priority:P1"]
```

Catatan: Pastikan read tool schema `issue_write.json` terlebih dahulu sebelum调用.

---

## 1. Overview

Product module dengan repository pattern, unified service, dan separate admin/member controllers. Member hanya bisa GET active products, Admin bisa CRUD semua products.

---

## 2. Files to Create

```
backend/src/modules/product/
├── product.module.ts
├── repository/
│   └── product.repository.ts
├── services/
│   └── product.service.ts
├── controllers/
│   ├── product.admin.controller.ts
│   └── product.member.controller.ts
└── dto/
    ├── index.ts
    ├── request/
    │   ├── create-product.dto.ts
    │   └── update-product.dto.ts
    └── response/
        └── product.response.dto.ts
```

---

## 3. Implementation

### Step 1: Create ProductRepository

```typescript
// src/modules/product/repository/product.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../infrastructure/database/database.module';
import { products, transactionItems } from '../../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../../infrastructure/database/schema';

export interface ProductEntity {
  id: string;
  name: string;
  description: string | null;
  price: number;
  costPrice: number | null;
  operationalCost: number | null;
  isActive: boolean;
}

export interface CreateProductData {
  name: string;
  price: number;
  description?: string;
  costPrice?: number;
  operationalCost?: number;
}

export interface UpdateProductData {
  name?: string;
  price?: number;
  description?: string;
  costPrice?: number;
  operationalCost?: number;
}

@Injectable()
export class ProductRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  private mapToEntity(p: typeof products.$inferSelect): ProductEntity {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      costPrice: p.costPrice ? parseFloat(p.costPrice) : null,
      operationalCost: p.operationalCost ? parseFloat(p.operationalCost) : null,
      isActive: p.isActive === 1,
    };
  }

  async findAllActive(): Promise<ProductEntity[]> {
    const result = await this.db
      .select()
      .from(products)
      .where(eq(products.isActive, 1));
    return result.map((p) => this.mapToEntity(p));
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const result = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findAll(): Promise<ProductEntity[]> {
    const result = await this.db.select().from(products);
    return result.map((p) => this.mapToEntity(p));
  }

  async create(data: CreateProductData): Promise<ProductEntity> {
    const [result] = await this.db
      .insert(products)
      .values({
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        costPrice: data.costPrice?.toString(),
        operationalCost: data.operationalCost?.toString(),
      })
      .returning();
    return this.mapToEntity(result);
  }

  async update(id: string, data: UpdateProductData): Promise<ProductEntity | null> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price.toString();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice.toString();
    if (data.operationalCost !== undefined)
      updateData.operationalCost = data.operationalCost.toString();

    const [result] = await this.db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return result ? this.mapToEntity(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const usedInTransactions = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(transactionItems)
      .where(eq(transactionItems.productId, id));

    if (usedInTransactions[0].count > 0) {
      await this.db
        .update(products)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(eq(products.id, id));
      return false;
    }

    await this.db.delete(products).where(eq(products.id, id));
    return true;
  }
}
```

### Step 2: Create ProductService

```typescript
// src/modules/product/services/product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ProductRepository,
  ProductEntity,
  CreateProductData,
  UpdateProductData,
} from '../repository/product.repository';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  // Member operations
  async getProducts(): Promise<ProductEntity[]> {
    return this.productRepository.findAllActive();
  }

  async getProductById(id: string): Promise<ProductEntity> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  // Admin operations
  async getAllProducts(): Promise<ProductEntity[]> {
    return this.productRepository.findAll();
  }

  async createProduct(data: CreateProductData): Promise<ProductEntity> {
    return this.productRepository.create(data);
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<ProductEntity> {
    const result = await this.productRepository.update(id, data);
    if (!result) {
      throw new NotFoundException('Product not found');
    }
    return result;
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    const hardDeleted = await this.productRepository.delete(id);
    return {
      message: hardDeleted
        ? 'Product deleted'
        : 'Product deactivated (soft delete) due to existing transactions',
    };
  }
}
```

### Step 3: Create DTOs

```typescript
// src/modules/product/dto/request/create-product.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductRequestDto {
  @ApiProperty({ example: 'Tiket A' })
  @IsString()
  name: string;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  operationalCost?: number;
}
```

```typescript
// src/modules/product/dto/request/update-product.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateProductRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  operationalCost?: number;
}
```

```typescript
// src/modules/product/dto/response/product.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  price: number;

  @ApiProperty({ nullable: true })
  costPrice: number | null;

  @ApiProperty({ nullable: true })
  operationalCost: number | null;

  @ApiPropertyOptional()
  isActive?: boolean;
}
```

```typescript
// src/modules/product/dto/index.ts
export * from './request/create-product.dto';
export * from './request/update-product.dto';
export * from './response/product.response.dto';
```

### Step 4: Create MemberController

```typescript
// src/modules/product/controllers/product.member.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ProductResponseDto } from '../dto';

@ApiTags('Products')
@Controller('products')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ProductMemberController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active products' })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: [ProductResponseDto],
  })
  async getProducts(): Promise<ProductResponseDto[]> {
    return this.productService.getProducts();
  }
}
```

### Step 5: Create AdminController

```typescript
// src/modules/product/controllers/product.admin.controller.ts
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
import { ProductService } from '../services/product.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CreateProductRequestDto,
  UpdateProductRequestDto,
  ProductResponseDto,
} from '../dto';

@ApiTags('Admin - Products')
@Controller('admin/products')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class ProductAdminController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products (including inactive)' })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async getProducts() {
    return this.productService.getAllProducts();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async createProduct(@Body() dto: CreateProductRequestDto) {
    return this.productService.createProduct(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductRequestDto,
  ) {
    return this.productService.updateProduct(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete or deactivate a product' })
  @ApiResponse({ status: 200, description: 'Product deleted or deactivated' })
  async deleteProduct(@Param('id') id: string) {
    return this.productService.deleteProduct(id);
  }
}
```

### Step 6: Create ProductModule

```typescript
// src/modules/product/product.module.ts
import { Module } from '@nestjs/common';
import { ProductRepository } from './repository/product.repository';
import { ProductService } from './services/product.service';
import { ProductMemberController } from './controllers/product.member.controller';
import { ProductAdminController } from './controllers/product.admin.controller';

@Module({
  controllers: [ProductMemberController, ProductAdminController],
  providers: [ProductRepository, ProductService],
  exports: [ProductService],
})
export class ProductModule {}
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 05] Product Module - CRUD with Repository Pattern`
Labels: `backend`, `task-05`, `priority:P1`

### After Implementation - Create PR

```bash
git checkout -b task/05-product-module
git add -A
git commit -m "feat: implement product module with repository pattern"
git push -u origin task/05-product-module
```

---

## 5. Verification Checklist

- [ ] Member can GET active products
- [ ] Admin can CRUD all products
- [ ] Soft delete for products with transactions
- [ ] Swagger docs updated
- [ ] Build successful
- [ ] GitHub issue created
- [ ] PR created
