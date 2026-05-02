---
name: task-03-common-guards-decorators
overview: "Task 3: Common Guards, Decorators, dan Filters"
todos:
  - id: 1
    content: Buat GitHub Issue untuk Task 03
    status: completed
  - id: 2
    content: Buat Roles decorator (src/common/decorators/roles.decorator.ts)
    status: completed
  - id: 3
    content: Buat CurrentUser decorator (src/common/decorators/current-user.decorator.ts)
    status: completed
  - id: 4
    content: Buat AuthGuard (src/common/guards/auth.guard.ts)
    status: completed
  - id: 5
    content: Buat RolesGuard (src/common/guards/roles.guard.ts)
    status: completed
  - id: 6
    content: Buat index.ts exports
    status: completed
  - id: 7
    content: Verify build successful
    status: completed
  - id: 8
    content: Buat PR ke branch task/03-common-guards-decorators
    status: completed
isProject: false
---

# Plan: Task 03 - Common Guards, Decorators, Filters

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Buat GitHub Issue untuk task ini | `issue_write` MCP tool |
| 2 | Implementasi guards, decorators, filters | `/executing-plans` |
| 3 | Buat PR setelah selesai | `/finishing-a-development-branch` |

### Fase 1 - Create GitHub Issue

Gunakan `issue_write` tool dari `user-github-mcp-server` MCP:

```
method: "create"
owner: "amirmufiddev"
repo: "eiger-backend"
title: "[Task 03] Common Guards, Decorators, dan Filters"
body: (isi overview)
labels: ["backend", "task-03", "priority:P1"]
```

Catatan: Pastikan read tool schema `issue_write.json` terlebih dahulu sebelum调用.

---

## 1. Overview

Membuat reusable guards (AuthGuard, RolesGuard), decorators (@Roles, @CurrentUser), dan menggunakan WinstonLogger untuk logging.

---

## 2. Files to Create

```
backend/src/common/
├── guards/
│   ├── auth.guard.ts
│   ├── roles.guard.ts
│   └── index.ts
├── decorators/
│   ├── roles.decorator.ts
│   ├── current-user.decorator.ts
│   └── index.ts
```

---

## 3. Implementation

### Step 1: Create Roles Decorator

```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### Step 2: Create CurrentUser Decorator

```typescript
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member';
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest<Request & { user: CurrentUserData }>();
    return request.user;
  },
);
```

### Step 3: Create AuthGuard

```typescript
// src/common/guards/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Request } from 'express';
import { DATABASE_CONNECTION } from '../../infrastructure/database/database.module';
import { sessions, users } from '../../infrastructure/database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../../infrastructure/database/schema';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: 'admin' | 'member';
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: PostgresJsDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      const cookieToken = (request.cookies as Record<string, string>)?.[
        'better-auth.session_token'
      ];
      if (cookieToken) {
        return this.validateToken(cookieToken, request);
      }
      throw new UnauthorizedException('No authorization token provided');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return this.validateToken(token, request);
  }

  private async validateToken(
    token: string,
    request: RequestWithUser,
  ): Promise<boolean> {
    const sessionResult = await this.db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const { session, user } = sessionResult[0];

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session expired');
    }

    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return true;
  }
}
```

### Step 4: Create RolesGuard

```typescript
// src/common/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: 'admin' | 'member';
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### Step 5: Create index files

```typescript
// src/common/guards/index.ts
export * from './auth.guard';
export * from './roles.guard';
```

```typescript
// src/common/decorators/index.ts
export * from './roles.decorator';
export * from './current-user.decorator';
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 03] Common Guards & Decorators`
Labels: `backend`, `task-03`, `priority:P1`

### After Implementation - Create PR

```bash
git checkout -b task/03-common-guards
git add -A
git commit -m "feat: add common guards and decorators"
git push -u origin task/03-common-guards
```

---

## 5. Verification Checklist

- [ ] AuthGuard validates tokens
- [ ] RolesGuard checks roles
- [ ] @Roles decorator works
- [ ] @CurrentUser decorator works
- [ ] Build successful
- [ ] GitHub issue created
- [ ] PR created
