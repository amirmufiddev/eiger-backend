---
name: task-07-membership-module
overview: "Task 7: Membership Module - Repository, Service, Admin/Member Controllers"
todos: []
isProject: false
---

# Plan: Task 07 - Membership Module

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Buat GitHub Issue untuk task ini | `/github-mcp-server` |
| 2 | Implementasi Membership module | `/executing-plans` |
| 3 | Buat PR setelah selesai | `/finishing-a-development-branch` |

---

## 1. Overview

Membership module untuk cek status membership. Member bisa GET profile membership, Admin bisa GET all dan update tier/points.

---

## 2. Files to Create

```
backend/src/modules/membership/
├── membership.module.ts
├── repository/
│   └── membership.repository.ts
├── services/
│   └── membership.service.ts
├── controllers/
│   ├── membership.admin.controller.ts
│   └── membership.member.controller.ts
└── dto/
    ├── index.ts
    └── response/
        └── membership.response.dto.ts
```

---

## 3. Implementation

### Step 1: Create MembershipRepository

```typescript
// src/modules/membership/repository/membership.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../infrastructure/database/database.module';
import { memberships } from '../../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../../infrastructure/database/schema';

export interface MembershipEntity {
  id: string;
  userId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
}

export interface UpdateMembershipData {
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  points?: number;
}

@Injectable()
export class MembershipRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  private mapToEntity(m: typeof memberships.$inferSelect): MembershipEntity {
    return {
      id: m.id,
      userId: m.userId,
      tier: m.tier as MembershipEntity['tier'],
      points: m.points,
    };
  }

  async findByUserId(userId: string): Promise<MembershipEntity | null> {
    const result = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);
    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findById(id: string): Promise<MembershipEntity | null> {
    const result = await this.db
      .select()
      .from(memberships)
      .where(eq(memberships.id, id))
      .limit(1);
    return result.length > 0 ? this.mapToEntity(result[0]) : null;
  }

  async findAll(): Promise<MembershipEntity[]> {
    const result = await this.db.select().from(memberships);
    return result.map((m) => this.mapToEntity(m));
  }

  async update(id: string, data: UpdateMembershipData): Promise<MembershipEntity | null> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.tier !== undefined) updateData.tier = data.tier;
    if (data.points !== undefined) updateData.points = data.points;

    const [result] = await this.db
      .update(memberships)
      .set(updateData)
      .where(eq(memberships.id, id))
      .returning();
    return result ? this.mapToEntity(result) : null;
  }

  async addPoints(id: string, points: number): Promise<MembershipEntity | null> {
    const [result] = await this.db
      .update(memberships)
      .set({
        points: eq(memberships.points, memberships.points),
        updatedAt: new Date(),
      })
      .where(eq(memberships.id, id))
      .returning();
    return result ? this.mapToEntity(result) : null;
  }
}
```

### Step 2: Create MembershipService

```typescript
// src/modules/membership/services/membership.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MembershipRepository,
  MembershipEntity,
  UpdateMembershipData,
} from '../repository/membership.repository';

@Injectable()
export class MembershipService {
  constructor(private readonly repository: MembershipRepository) {}

  async getMembershipByUserId(userId: string): Promise<MembershipEntity> {
    const membership = await this.repository.findByUserId(userId);
    if (!membership) throw new NotFoundException('Membership not found');
    return membership;
  }

  async getAllMemberships(): Promise<MembershipEntity[]> {
    return this.repository.findAll();
  }

  async updateMembership(id: string, data: UpdateMembershipData): Promise<MembershipEntity> {
    const result = await this.repository.update(id, data);
    if (!result) throw new NotFoundException('Membership not found');
    return result;
  }

  async addPoints(id: string, points: number): Promise<MembershipEntity> {
    const membership = await this.repository.findById(id);
    if (!membership) throw new NotFoundException('Membership not found');

    const [result] = await this.repository.update(id, {
      points: membership.points + points,
    } as UpdateMembershipData);
    if (!result) throw new NotFoundException('Membership not found');
    return result;
  }
}
```

### Step 3: Create DTOs

```typescript
// src/modules/membership/dto/response/membership.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class MembershipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ['bronze', 'silver', 'gold', 'platinum'] })
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';

  @ApiProperty()
  points: number;
}
```

```typescript
// src/modules/membership/dto/index.ts
export * from './response/membership.response.dto';
```

### Step 4: Create MemberController

```typescript
// src/modules/membership/controllers/membership.member.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MembershipService } from '../services/membership.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';
import { MembershipResponseDto } from '../dto';

@ApiTags('Membership')
@Controller('membership')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class MembershipMemberController {
  constructor(private readonly service: MembershipService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user membership profile' })
  @ApiResponse({ status: 200, type: MembershipResponseDto })
  async getProfile(@CurrentUser() user: CurrentUserData): Promise<MembershipResponseDto> {
    return this.service.getMembershipByUserId(user.id);
  }
}
```

### Step 5: Create AdminController

```typescript
// src/modules/membership/controllers/membership.admin.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MembershipService } from '../services/membership.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { MembershipResponseDto } from '../dto';

class UpdateMembershipDto {
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  points?: number;
}

@ApiTags('Admin - Membership')
@Controller('admin/membership')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class MembershipAdminController {
  constructor(private readonly service: MembershipService) {}

  @Get()
  @ApiOperation({ summary: 'Get all memberships' })
  @ApiResponse({ status: 200, type: [MembershipResponseDto] })
  async getAll() {
    return this.service.getAllMemberships();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update membership tier/points' })
  @ApiResponse({ status: 200, type: MembershipResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.service.updateMembership(id, dto);
  }

  @Patch(':id/add-points')
  @ApiOperation({ summary: 'Add points to membership' })
  @ApiResponse({ status: 200, type: MembershipResponseDto })
  async addPoints(
    @Param('id') id: string,
    @Body('points') points: number,
  ) {
    return this.service.addPoints(id, points);
  }
}
```

### Step 6: Create Module

```typescript
// src/modules/membership/membership.module.ts
import { Module } from '@nestjs/common';
import { MembershipRepository } from './repository/membership.repository';
import { MembershipService } from './services/membership.service';
import { MembershipMemberController } from './controllers/membership.member.controller';
import { MembershipAdminController } from './controllers/membership.admin.controller';

@Module({
  controllers: [MembershipMemberController, MembershipAdminController],
  providers: [MembershipRepository, MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 07] Membership Module - Profile & Tier Management`
Labels: `backend`, `task-07`, `priority:P1`

### After Implementation - Create PR

```bash
git checkout -b task/07-membership-module
git add -A
git commit -m "feat: implement membership module"
git push -u origin task/07-membership-module
```

---

## 5. Verification Checklist

- [ ] Member can GET own membership profile
- [ ] Admin can GET all memberships
- [ ] Admin can update tier/points
- [ ] Swagger docs updated
- [ ] Build successful
- [ ] GitHub issue created
- [ ] PR created
