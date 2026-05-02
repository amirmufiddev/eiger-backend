---
name: task-02-database-schema
overview: "Task 2: Database Infrastructure - Drizzle Schema & Database Module"
todos:
  - id: 1
    content: "Buat GitHub Issue untuk Task 02"
    status: pending
  - id: 2
    content: "Buat directory src/infrastructure/database/"
    status: pending
  - id: 3
    content: "Buat DatabaseModule (database.module.ts)"
    status: pending
  - id: 4
    content: "Buat Schema dengan semua entities dan relations (schema.ts)"
    status: pending
  - id: 5
    content: "Buat Seed script (seed.ts)"
    status: pending
  - id: 6
    content: "Update AppModule untuk import DatabaseModule"
    status: pending
  - id: 7
    content: "Verify build successful"
    status: pending
  - id: 8
    content: "Buat PR ke branch task/02-database-schema"
    status: pending
isProject: true
---

# Plan: Task 02 - Database Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Buat GitHub Issue untuk task ini | `issue_write` MCP tool |
| 2 | Implementasi database infrastructure | `/executing-plans` |
| 3 | Buat PR setelah selesai | `/finishing-a-development-branch` |

### Fase 1 - Create GitHub Issue

Gunakan `issue_write` tool dari `user-github-mcp-server` MCP:

```
method: "create"
owner: "amirmufiddev"
repo: "eiger-backend"
title: "[Task 02] Database Infrastructure - Drizzle Schema"
body: (isi overview dan entity descriptions)
labels: ["backend", "task-02", "priority:P1"]
```

Catatan: Pastikan read tool schema `issue_write.json` terlebih dahulu sebelum调用.

---

## 1. Overview

Setup Drizzle ORM dengan PostgreSQL: schema untuk users, sessions, memberships, wallets, products, payment_methods, transactions, transaction_items.

### 1.1 ER Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar name
        user_role role
        timestamp created_at
        timestamp updated_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        text token UK
        timestamp expires_at
        varchar ip_address
        text user_agent
        timestamp created_at
        timestamp updated_at
    }

    MEMBERSHIPS {
        uuid id PK
        uuid user_id FK UK
        varchar tier
        integer points
        timestamp created_at
        timestamp updated_at
    }

    WALLETS {
        uuid id PK
        uuid user_id FK UK
        numeric balance
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
        uuid id PK
        varchar name
        text description
        numeric price
        numeric cost_price
        numeric operational_cost
        integer is_active
        timestamp created_at
        timestamp updated_at
    }

    PAYMENT_METHODS {
        uuid id PK
        varchar code UK
        varchar name
        integer is_active
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid payment_method_id FK
        transaction_status status
        numeric total
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTION_ITEMS {
        uuid id PK
        uuid transaction_id FK
        uuid product_id FK
        integer qty
        numeric unit_price
        timestamp created_at
    }

    USERS ||--o{ SESSIONS : "has"
    USERS ||--|| MEMBERSHIPS : "has_one"
    USERS ||--|| WALLETS : "has_one"
    USERS ||--o{ TRANSACTIONS : "makes"
    MEMBERSHIPS ||--|| USERS : "belongs_to"
    WALLETS ||--|| USERS : "belongs_to"
    TRANSACTIONS ||--|| PAYMENT_METHODS : "uses"
    TRANSACTIONS ||--o{ TRANSACTION_ITEMS : "contains"
    TRANSACTION_ITEMS ||--|| PRODUCTS : "references"
```

### Entity Descriptions

| Table | Deskripsi |
|-------|-----------|
| `users` | User account dengan role admin/member |
| `sessions` | Session tokens untuk authentication |
| `memberships` | Membership tier dan points per user |
| `wallets` | E-wallet balance per user |
| `products` | Produk/tiket yang dijual (active/inactive) |
| `payment_methods` | Metode pembayaran (EWALLET, VA, QRIS, CC) |
| `transactions` | Header transaksi |
| `transaction_items` | Item-item dalam transaksi |

---

## 2. Files to Create

### New Files

```
backend/src/infrastructure/database/
├── database.module.ts    # Drizzle connection module
├── schema.ts            # All entity definitions
└── seed.ts             # Seed data script
```

---

## 3. Implementation

### Step 1: Create DatabaseModule

```typescript
// src/infrastructure/database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { DATABASE_CONNECTION } from './database.module';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: async () => {
        const { drizzle } = await import('drizzle-orm/postgres-js');
        const { default: postgres } = await import('postgres');

        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL is not defined');
        }

        const client = postgres(connectionString);
        return drizzle(client);
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
```

### Step 2: Create Schema

```typescript
// src/infrastructure/database/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('user_role', ['admin', 'member']);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: roleEnum('role').default('member').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  tier: varchar('tier', { length: 50 }).default('bronze').notNull(),
  points: integer('points').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  balance: numeric('balance', { precision: 15, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 15, scale: 2 }).notNull(),
  costPrice: numeric('cost_price', { precision: 15, scale: 2 }),
  operationalCost: numeric('operational_cost', { precision: 15, scale: 2 }),
  isActive: integer('is_active').default(1).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: integer('is_active').default(1).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  paymentMethodId: uuid('payment_method_id').notNull().references(() => paymentMethods.id),
  status: transactionStatusEnum('status').default('pending').notNull(),
  total: numeric('total', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const transactionItems = pgTable('transaction_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  qty: integer('qty').notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  membership: one(memberships, { fields: [users.id], references: [memberships.userId] }),
  wallet: one(wallets, { fields: [users.id], references: [wallets.userId] }),
  transactions: many(transactions),
  sessions: many(sessions),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  paymentMethod: one(paymentMethods, { fields: [transactions.paymentMethodId], references: [paymentMethods.id] }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, { fields: [transactionItems.transactionId], references: [transactions.id] }),
  product: one(products, { fields: [transactionItems.productId], references: [products.id] }),
}));
```

### Step 3: Create Seed Script

```typescript
// src/infrastructure/database/seed.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function seed() {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  // Create admin user
  const [admin] = await db
    .insert(schema.users)
    .values({ email: 'admin@eiger.com', name: 'Admin', role: 'admin' })
    .returning();

  // Create member user
  const [member] = await db
    .insert(schema.users)
    .values({ email: 'member@eiger.com', name: 'Test Member', role: 'member' })
    .returning();

  // Create wallets
  await db.insert(schema.wallets).values([
    { userId: admin.id, balance: '1000000' },
    { userId: member.id, balance: '500000' },
  ]);

  // Create memberships
  await db.insert(schema.memberships).values([
    { userId: admin.id, tier: 'gold', points: 10000 },
    { userId: member.id, tier: 'silver', points: 500 },
  ]);

  // Create products
  await db.insert(schema.products).values([
    { name: 'Base Entrance Pass', description: 'Tiket wajib masuk kawasan EAL', price: '50000', costPrice: '10000', operationalCost: '5000' },
    { name: 'Suspension Bridge', description: 'Wahana suspension bridge', price: '75000', costPrice: '15000', operationalCost: '8000' },
    { name: 'Cable Car', description: 'Wahana cable car', price: '100000', costPrice: '20000', operationalCost: '10000' },
    { name: 'All-Access Pass', description: 'Tiket terusan + wahana premium', price: '200000', costPrice: '40000', operationalCost: '15000' },
  ]);

  // Create payment methods
  await db.insert(schema.paymentMethods).values([
    { code: 'EWALLET', name: 'E-Wallet EAL' },
    { code: 'VA', name: 'Virtual Account' },
    { code: 'QRIS', name: 'QRIS' },
    { code: 'CC', name: 'Kartu Kredit' },
  ]);

  console.log('Seed completed!');
  console.log('Admin:', admin.email);
  console.log('Member:', member.email);

  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

### Step 4: Update AppModule

```typescript
// src/app.module.ts (add import)
import { DatabaseModule } from './infrastructure/database/database.module';

// In imports array:
DatabaseModule,
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 02] Database Infrastructure - Drizzle Schema`
Labels: `backend`, `task-02`, `priority:P1`

### After Implementation - Create PR

```bash
git checkout -b task/02-database-schema
git add -A
git commit -m "feat: add database infrastructure with Drizzle schema"
git push -u origin task/02-database-schema
```

---

## 5. Verification Checklist

- [ ] DatabaseModule configured
- [ ] Schema with all entities created
- [ ] Relations defined
- [ ] Seed script created
- [ ] Build successful
- [ ] GitHub issue created
- [ ] PR created
