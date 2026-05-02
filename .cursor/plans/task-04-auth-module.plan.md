---
name: task-04-auth-module
overview: "Task 4: Auth Module - Register, Login, Session Management (better-auth)"
todos:
  - id: 1
    content: "Install @thallesp/nestjs-better-auth + @better-auth/drizzle-adapter + better-auth"
    status: completed
  - id: 2
    content: "Create better-auth instance (src/lib/auth.ts)"
    status: completed
  - id: 3
    content: "Rewrite AuthModule with nestjs-better-auth"
    status: completed
  - id: 4
    content: "Rewrite AuthHooks for auto wallet/membership on user create"
    status: completed
  - id: 5
    content: "Update AuthController (use @Session decorator)"
    status: completed
  - id: 6
    content: "Update common guards to use @thallesp/nestjs-better-auth"
    status: completed
  - id: 7
    content: "Fix unit tests"
    status: completed
  - id: 8
    content: "Update plan files and PRD.md"
    status: in_progress
  - id: 9
    content: "Verify build + unit tests pass"
    status: pending
  - id: 10
    content: "Commit and push PR"
    status: pending
isProject: false
---

# Plan: Task 04 - Auth Module (better-auth)

## Overview

Auth module menggunakan `better-auth` library via `@thallesp/nestjs-better-auth`. Session management ditangani oleh better-auth (cookie-based). User registration автоматически membuat wallet dan membership via `@AfterCreate` database hook.

## Key Implementation Changes

### Architecture

```
src/lib/auth.ts              # better-auth instance dengan drizzleAdapter
src/modules/auth/
├── auth.module.ts           # NestjsAuthModule.forRoot({ auth, disableControllers: true })
├── auth.service.ts          # AuthHooks (DatabaseHook) untuk auto wallet/membership
├── auth.controller.ts       # Custom endpoints: register, login, logout, profile
└── dto/
    ├── index.ts
    ├── register.dto.ts
    └── login.dto.ts
src/common/guards/           # Re-export dari @thallesp/nestjs-better-auth
```

### Dependencies

```bash
pnpm add better-auth @thallesp/nestjs-better-auth @better-auth/drizzle-adapter
```

### better-auth Configuration

- Provider: `pg` (PostgreSQL via drizzleAdapter)
- Session: cookie-based, 30 days expiry
- Schema mapping: `users` → `user`, `sessions` → `session`
- basePath: `/auth`

### AuthController Endpoints

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | /auth/register | @AllowAnonymous | Sign up with email/password |
| POST | /auth/login | @AllowAnonymous | Sign in with email/password |
| POST | /auth/logout | @AuthGuard | Sign out current session |
| GET | /auth/profile | @AuthGuard | Get current user profile |

### Auto Wallet/Membership

`AuthHooks` class dengan `@DatabaseHook()` decorator menggunakan `@AfterCreate('user')` untuk membuat wallet dan membership saat user baru register.

## Verification Checklist

- [x] better-auth instance created
- [x] AuthModule uses NestjsAuthModule.forRoot
- [x] AuthController has register/login/logout/profile endpoints
- [x] AuthHooks creates wallet + membership on user creation
- [x] Guards re-exported from @thallesp/nestjs-better-auth
- [x] Unit tests pass (auth.service.spec.ts, auth.controller.spec.ts)
- [x] Build successful
- [ ] PRD.md updated
- [ ] E2E tests updated (blocked by Jest/ESM incompatibility)
