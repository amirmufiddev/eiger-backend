---
name: task-03-common-guards-decorators
overview: "Task 3: Common Guards, Decorators, dan Filters (better-auth)"
todos:
  - id: 1
    content: "Buat GitHub Issue untuk Task 03"
    status: completed
  - id: 2
    content: "Buat Roles decorator (src/common/decorators/roles.decorator.ts)"
    status: completed
  - id: 3
    content: "Buat CurrentUser decorator (src/common/decorators/current-user.decorator.ts)"
    status: completed
  - id: 4
    content: "Re-export guards dari @thallesp/nestjs-better-auth"
    status: completed
  - id: 5
    content: "Verify build successful"
    status: completed
  - id: 6
    content: "Buat PR ke branch task/03-common-guards-decorators"
    status: completed
isProject: false
---

# Plan: Task 03 - Common Guards, Decorators, Filters (better-auth)

## Overview

**Updated**: Guards dan decorators authentication sekarang berasal dari `@thallesp/nestjs-better-auth`. Custom `AuthGuard` dan `RolesGuard` digantikan dengan re-export dari library.

### Guards dari @thallesp/nestjs-better-auth

- `AuthGuard` - validates session cookie/Bearer token
- `Roles` - decorator untuk role-based access
- `@AllowAnonymous` - allow unauthenticated access
- `@Session` - inject user session

### CurrentUser decorator tetap lokal

`src/common/decorators/current-user.decorator.ts` tetap menggunakan custom implementation untuk backward compatibility dengan modul lain.

---

## Verification Checklist

- [x] Guards re-exported from @thallesp/nestjs-better-auth
- [x] RolesGuard works with @Roles decorator
- [x] @AllowAnonymous works
- [x] @Session decorator works
- [x] Build successful
