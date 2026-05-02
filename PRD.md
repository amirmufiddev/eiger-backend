---
name: Eiger Test Dev
overview: ""
---

## Workflow

Ikuti fase **Phase 1–5** dengan skill Superpowers yang relevan:

| Fase | Aktivitas                                                                    | Skill                                                        |
| ---- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | Klarifikasi scope, risiko concurrency checkout, kontrak API BE↔FE            | `/brainstorming`                                             |
| 2    | Setup NestJS project dengan Fastify + Redis + nest-winston                   | `/using-git-worktrees`                                       |
| 3    | Tulis/maintain 15 individual task plans                                      | `/writing-plans`                                             |
| 4    | Implementasi paralel: foundation → modules → router → events → tests → CI/CD | `/subagent-driven-development` atau `/executing-plans`       |
| 5    | Review, CI hijau, merge                                                      | `/requesting-code-review`, `/finishing-a-development-branch` |

### Tech Stack

- **Backend (NestJS + Fastify)**
  - Node.js 20+, NestJS, **Fastify adapter** (`@nestjs/platform-fastify`)
  - Drizzle ORM + PostgreSQL 15+, Redis + Socket.io adapter (`ioredis`, `@socket.io/redis-adapter`)
  - Security middleware: `@fastify/helmet`, `@fastify/cors`, `@fastify/csrf`, `@fastify/rate-limit`, `@fastify/compression`
  - **nest-winston** + Winston untuk logging, `@nestjs/swagger`, class-validator/class-transformer
  - Docker multi-stage build

- **Repo `frontend/` (Git repo B)**
  - Node.js LTS, **pnpm atau pnpm hanya di root repo ini**.
  - Next.js (App Router), React, fetching (fetch atau TanStack Query — pilih satu dan konsisten), client Socket.io, Docker.

- **Observabilitas kontrak API**
  - Sumber kebenaran: Swagger/OpenAPI di backend. Saat implementasi butuh snippet/setup terbaru Nest/Drizzle/Next: gunakan **Context7 MCP**.

### Prerequisites Checklist

- [ ] NestJS CLI terinstall (`npm i -g @nestjs/cli`)
- [ ] PostgreSQL jalan (Docker Compose di backend orchestrasi `postgres` + `redis`)
- [ ] Redis server running
- [ ] Env BE: `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGIN` (URL FE), `PORT`
- [ ] Env FE: `NEXT_PUBLIC_API_URL` (REST), `NEXT_PUBLIC_WS_URL` (Socket.io)
- [ ] Versi Node documented di README masing-masing repo

---

## 1. Overview

Eiger Adventure Land (EAL) adalah destinasi _smart & eco-tourism_ yang menggunakan sistem **Cashless & Single-Identity Pass**. Seluruh tiket berwujud **Dynamic QR Code** terikat membership пользователя.

### 1.1 Skema Tiket (Product Catalog)

| Kategori                 | Deskripsi                                    | Akses                                                |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------- |
| **Base Entrance Pass**   | Tiket wajib masuk kawasan EAL                | Fasilitas umum, Cultural Walk, Forest Adventure Zone |
| **Premium Ride Add-ons** | Tiket wahana eksklusif dengan kuota terbatas | Suspension Bridge, Cable Car                         |
| **All-Access Bundling**  | Tiket terusan masuk + seluruh wahana premium | Semua fasilitas + wahana premium                     |

### 1.2 Skema Pembayaran

| Jalur                           | Metode                              | Use Case                                                |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| **Eksternal (Payment Gateway)** | Virtual Account, QRIS, Kartu Kredit | Booking tiket dari rumah (di luar kawasan)              |
| **Internal (E-Wallet EAL)**     | Closed-loop payment                 | Transaksi di dalam kawasan (lebih cepat, minim failure) |

### 1.3 Core Functionality

Produk adalah demo sistem pembelian (tiket/barang) dengan **e-wallet**, **membership/poin**, **metode pembayaran**, **checkout atomik**, **emit IoT lewat WebSocket** setelah sukses, dan **laporan transaksi + PnL** dengan agregasi di SQL. Pengguna dibagi **peran**: **`member`** — **register**, **login**, **`role=member` sesudah signup**, akses **e-wallet** termasuk **top-up saldo**, checkout, membership tier/poin, laporan sendiri; **`admin`** — mengelola data master lewat **CRUD** pada **products**, **payment_methods**, dan **memberships** (buat/baca/ubah/hapus baris membership terikat `user_id`; audit/disarankan logging untuk mutasi poin/tier). Backend dan frontend **repositori Git terpisah**; tidak ada monorepo workspace bersama.

**Tanggung jawab**

- Backend: autentikasi/sesi, **RBAC** (`member` | `admin`), domain finansial, atomikasi checkout, WebSocket gateway, reporting, OpenAPI; endpoint admin terpisah atau guard pada route mutasi.
- Frontend: UI **member** (`/register`, `/login`, **top-up wallet**, checkout, reports); UI **`/admin`** untuk CRUD katalog; konsumsi API + listener realtime.

**Prinsip arsitektur (SOLID / clean)**

- **Backend:** **policy terpisah** — guard `@Roles()` / `RolesGuard` memutus authorize tanpa mencampur di handler bisnis; use case **checkout** tetap satu kelas satu alasan ubah; CRUD admin melalui **application services** dedikasi (`AdminProductService`, dll.) dengan injeksi repository.
- **Frontend:** route group `app/(member)` vs `app/(admin)`; komponen admin tidak diimpor sembarangan di halaman member; tipe role diselaraskan API/session.

---

## Prerequisites

### Issue yang harus sudah ada

- Satu **epic/issue** induk (opsional) + issue per milestone PRD; tautkan di bagian GitHub Issue di bawah saat nomor tersedia.

### Konfigurasi

- Dua repositori; CORS BE mengizinkan origin FE.
- Swagger UI dapat diakses dari lingkungan dev (dan dibatasi di prod jika perlu).

### Data

- Seed minimal: **user `member`** (wallet, membership), **user `admin`** (`role=admin`), produk, payment methods.

### Backend Dependencies

- PostgreSQL; Better-Auth sesuai dokumen resmi terbaru (verifikasi via Context7 saat setup).

---

## 2. Requirements

| Layer        | Teknologi                | Catatan                                                                                            |
| ------------ | ------------------------ | -------------------------------------------------------------------------------------------------- |
| API          | NestJS + **Fastify**     | `@nestjs/platform-fastify` sebagai HTTP adapter                                                    |
| DB           | Drizzle + PostgreSQL     | `db.transaction()` untuk checkout                                                                  |
| Cache/PubSub | Redis + Socket.io        | `ioredis`, `@socket.io/redis-adapter` untuk distributed deployment                                 |
| Auth         | Custom Session           | Token-based session di database (bukan Better-Auth)                                                |
| RBAC         | Nest Guards + metadata   | `AuthGuard` + `RolesGuard` dengan `@Roles()` decorator                                             |
| Logging      | nest-winston + Winston   | Structured logging, semua error di Exception Filter                                                |
| Security     | Fastify plugins          | `@fastify/helmet`, `@fastify/cors`, `@fastify/csrf`, `@fastify/rate-limit`, `@fastify/compression` |
| Realtime     | Socket.io (Nest gateway) | EventsGateway dengan Redis adapter; folder: `events/`                                              |
| FE           | Next.js 16 + TypeScript  | App Router; Env terpisah per repo; proteksi rute admin di FE + verifikasi di BE                    |
| UI           | shadcn/ui + Radix UI     | Base components; dark/light mode; accessible                                                       |
| Data Fetch   | TanStack Query           | Server state management; caching; optimistic updates                                               |
| Forms        | React Hook Form + Zod    | Type-safe form validation                                                                          |
| Charts       | Recharts                 | Data visualization untuk reports (PnL, revenue)                                                    |
| Animation    | Framer Motion            | Page transitions; micro-interactions                                                               |
| State        | Zustand / Context API    | Client state management; lightweight                                                               |

**Instalasi paket:** jalankan di **root masing-masing repo** (bukan workspace bersama):

```bash
# backend (NestJS + Fastify)
pnpm add @nestjs/core @nestjs/common @nestjs/platform-fastify
pnpm add @nestjs/config @nestjs/swagger @nestjs/websockets @nestjs/platform-socket.io
pnpm add drizzle-orm postgres
pnpm add nest-winston winston
pnpm add @fastify/helmet @fastify/cors @fastify/csrf @fastify/rate-limit @fastify/compression
pnpm add ioredis @socket.io/redis-adapter socket.io
pnpm add class-validator class-transformer uuid

# frontend
pnpm add next@16 react react-dom
pnpm add typescript @types/react @types/react-dom
pnpm add @tanstack/react-query
pnpm add zustand
pnpm add react-hook-form @hookform/resolvers zod
pnpm add recharts
pnpm add framer-motion
pnpm add socket.io-client
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-label @radix-ui/react-slot
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react
pnpm add tailwindcss postcss autoprefixer
```

Contoh **env backend** (`.env.example` di repo backend):

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/eiger
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

Contoh **env frontend** (`.env.example` di repo frontend):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## 3. API Endpoints

### Public Endpoints

| Method | Endpoint         | Akses  | Deskripsi            |
| ------ | ---------------- | ------ | -------------------- |
| POST   | `/auth/register` | Public | Register member baru |
| POST   | `/auth/login`    | Public | Login                |

### Member Endpoints

| Method | Endpoint                   | Deskripsi                      |
| ------ | -------------------------- | ------------------------------ |
| POST   | `/auth/logout`             | Logout                         |
| GET    | `/products`                | Get semua product aktif        |
| GET    | `/payment-methods`         | Get payment methods aktif      |
| GET    | `/membership/profile`      | Get profile membership sendiri |
| GET    | `/wallet/balance`          | Get wallet balance             |
| POST   | `/wallet/topup`            | Topup saldo (tolak amount ≤ 0) |
| POST   | `/transactions/checkout`   | Checkout atomik                |
| GET    | `/transactions`            | Get history transaksi sendiri  |
| GET    | `/transactions/:id`        | Get detail transaksi           |
| POST   | `/transactions/:id/cancel` | Cancel transaksi pending       |

### Admin Endpoints

| Method | Endpoint                      | Deskripsi                                       |
| ------ | ----------------------------- | ----------------------------------------------- |
| GET    | `/admin/products`             | Get semua product (termasuk inactive)           |
| POST   | `/admin/products`             | Create product                                  |
| PATCH  | `/admin/products/:id`         | Update product                                  |
| DELETE | `/admin/products/:id`         | Delete product (soft delete jika ada referensi) |
| GET    | `/admin/payment-methods`      | Get semua payment method                        |
| POST   | `/admin/payment-methods`      | Create payment method                           |
| PATCH  | `/admin/payment-methods/:id`  | Update payment method                           |
| DELETE | `/admin/payment-methods/:id`  | Delete payment method                           |
| GET    | `/admin/membership`           | Get semua membership                            |
| PATCH  | `/admin/membership/:id`       | Update tier/points                              |
| GET    | `/admin/wallet`               | Get semua wallet                                |
| POST   | `/admin/wallet/:userId/topup` | Topup wallet user lain                          |
| GET    | `/admin/transactions`         | Get semua transaksi                             |
| GET    | `/admin/reports/revenue`      | Revenue report                                  |
| GET    | `/admin/reports/transactions` | Transaction report                              |
| GET    | `/admin/reports/membership`   | Membership report                               |

Contoh **admin create product**:

```json
{
  "name": "Tiket A",
  "price": 75000,
  "cost_price": 15000,
  "operational_cost": 5000
}
```

Contoh **response** `201`:

```json
{
  "id": "...",
  "name": "Tiket A",
  "price": 75000,
  "cost_price": 15000,
  "operational_cost": 5000
}
```

> **Note:** `cost_price` dan `operational_cost` adalah field opsional. Jika tidak diisi, produk tidak muncul di laporan PnL per produk.

Contoh **member top-up request**:

```json
{
  "amount": 50000
}
```

Contoh **top-up response** `200`:

```json
{
  "balance": 150000
}
```

Contoh **admin create membership**:

```json
{
  "userId": "...",
  "tier": "gold",
  "points": 100
}
```

Contoh **checkout request** (disederhanakan):

```json
{
  "productIds": [{ "id": "...", "qty": 1 }],
  "paymentMethodId": "..."
}
```

Contoh **checkout response** (disederhanakan):

```json
{
  "transactionId": "...",
  "status": "completed",
  "total": 150000
}
```

**Offline:** tidak wajib; jika butuh UX fallback FE, catat di Catatan Asumsi.

---

## 4. Database Schema

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

| Table               | Deskripsi                                  |
| ------------------- | ------------------------------------------ |
| `users`             | User account dengan role admin/member      |
| `sessions`          | Session tokens untuk authentication        |
| `memberships`       | Membership tier dan points per user        |
| `wallets`           | E-wallet balance per user                  |
| `products`          | Produk/tiket yang dijual (active/inactive) |
| `payment_methods`   | Metode pembayaran (EWALLET, VA, QRIS, CC)  |
| `transactions`      | Header transaksi                           |
| `transaction_items` | Item-item dalam transaksi                  |

---

## 5. Frontend Pages

| Page               | Route                    | Deskripsi                                                                                                                                        | Access       |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | -------------------------------------------------- | ----------- |
| Register member    | `/register`              | Form signup Better-Auth → akun **`member`**                                                                                                      | Publik       |
| Login member       | `/login`                 | Masuk; sesi memuat `role` untuk routing                                                                                                          | Publik       |
| Ride Status        | `/rides`                 | Public page - Grid 3 kolom status gate wahana realtime (Hijau=open, Merah=closed). WebSocket listener untuk `gate_open`/`gate_close` per product | Publik       |
| Wallet / top-up    | `/wallet`                | Lihat saldo + **form top-up** (POST `/wallet/top-up`)                                                                                            | **member**   |
| Pembelian          | `/checkout` atau `/`     | Pilih produk → checkout → indikator Socket sukses                                                                                                | **member**   |
| Transaction Detail | `/transactions/:id`      | Detail transaksi + **ganti metode pembayaran** (jika status pending/failed) + **tombol cancel** (jika pending)                                   | **member**   |
| Laporan            | `/reports`               | Tab-based: Revenue                                                                                                                               | Transactions | Membership (+ PnL scoped member atau global admin) | **member+** |
| Admin — produk     | `/admin/products`        | Tabel + form CRUD produk                                                                                                                         | **admin**    |
| Admin — metode     | `/admin/payment-methods` | CRUD payment methods                                                                                                                             | **admin**    |
| Admin — membership | `/admin/memberships`     | Daftar + form CRUD membership (`user_id`, tier, poin) + **collapsible wallet section** (GET/POST `/admin/wallet`)                                | **admin**    |

**Page Flow (ASCII)**

```
/register  → redirect login/dashboard setelah sukses
/login

/rides   [public, no auth]
├── load all products (premium rides)
├── display 3-column grid card
└── WebSocket listener: gate_open/gate_close per product
    └── Card turns Hijau (#22c55e) on gate_open
    └── Card turns Merah (#ef4444) on gate_close/idle

/wallet   [member]
├── GET saldo
└── POST top-up → refresh saldo

/ (atau /checkout)   [member]
├── load products + wallet + membership
├── checkout POST → on success emit WS "gate_open"
├── if payment failed → link to change payment method
└── link ke /reports

/transactions/:id   [member]
├── GET transaction detail
├── if status = pending/failed → show "Ganti Metode Pembayaran"
├── if status = pending → show "Cancel" button
└── POST /transactions/:id/cancel if cancel clicked

/reports   [member | admin]
├── Tab: Revenue | Transactions | Membership
├── transactions table (scoped)
└── pnl summary (SQL aggregated)

/admin/products   [admin]
├── list → create/edit/delete

/admin/payment-methods   [admin]
├── list → create/edit/delete

/admin/memberships   [admin]
├── list → create → edit tier/poin → delete
└── collapsible: wallet section (all wallets, admin top-up)
```

---

## 6. Core Features

### 6.1 Auth & Session Management

- Custom session-based authentication (token di database, bukan JWT)
- Register member baru → auto-create wallet + membership
- Login → return token, simpan session di `sessions` table
- Token expiration 30 hari

### 6.2 RBAC (Role-Based Access Control)

- `AuthGuard` - validates Bearer token dari header/cookie
- `RolesGuard` - checks `@Roles('admin')` decorator
- Enum/peran `admin` | `member` disimpan di `users.role`
- `RolesGuard` menolak dengan **403** jika role tidak cocok

### 6.3 Membership & wallet

- **`member`**: `GET /membership/profile` untuk tier/poin; **`GET /wallet/balance`** saldo; **`POST /wallet/topup`** menambah saldo
- Setelah **register** sukses: service membuat baris **`wallets`** (+ **`memberships`** default tier `bronze`, points `0`)

### 6.4 Product & Payment Method Management

- Product listing untuk member (hanya `is_active = 1`)
- Admin CRUD products (soft delete jika ada referensi transaksi)
- Admin CRUD payment methods

### 6.5 Checkout atomik

- Satu `db.transaction()`: cek saldo → insert transaction + items → kurangi wallet → increment poin membership
- Rollback total jika gagal
- Validasi: product exists, qty > 0, balance sufficient

### 6.6 IoT WebSocket (Events Gateway)

- Folder: `events/` (bukan `realtime/`)
- Redis adapter untuk distributed deployment
- Events: `transaction:update`, `membership:update`, `wallet:update`, `notification`

### 6.7 Reporting

- SQL aggregation untuk PnL (`SUM(transaction_items.qty * products.cost_price)`)
- Revenue report, transaction report, membership report
- Filter `user_id` untuk scoped results

### 6.8 Security Middleware

| Feature       | Package                | Configuration                      |
| ------------- | ---------------------- | ---------------------------------- |
| HTTP Headers  | `@fastify/helmet`      | contentSecurityPolicy: false       |
| CORS          | `@fastify/cors`        | origin dari env, credentials: true |
| CSRF          | `@fastify/csrf`        | cookie-based                       |
| Rate Limiting | `@fastify/rate-limit`  | max: 100, timeWindow: 1 minute     |
| Compression   | `@fastify/compression` | gzip, deflate                      |

### 6.9 Logging & Error Handling

- **nest-winston** + Winston untuk structured logging
- Console transport (colored) + File transport (`logs/error.log`, `logs/combined.log`)
- `AllExceptionsFilter` logs semua error dengan WinstonLogger
- `LoggingInterceptor` logs semua request/response

---

## 7. User Flow

```mermaid
flowchart LR
  subgraph memberAuth [Member_auth_wallet]
    reg[Register]
    login[Login]
    topUp[POST_wallet_top-up]
  end
  reg --> login
  login --> topUp
```

```mermaid
flowchart LR
  subgraph fe [FrontendRepo]
    selectProduct[SelectProduct]
    checkoutReq[POST_checkout]
    wsListen[Listen_open_gate]
  end
  subgraph be [BackendRepo]
    validateAuth[ValidateAuth]
    atomicTx[Atomic_DB_Transaction]
    emitWS[Emit_WebSocket]
  end
  selectProduct --> checkoutReq
  checkoutReq --> validateAuth
  validateAuth --> atomicTx
  atomicTx --> emitWS
  emitWS --> wsListen
```

```mermaid
flowchart TD
  subgraph adminFlow [Admin_CRUD]
    loginA[Login_admin]
    guardA[RolesGuard_admin]
    crudP[CRUD_products]
    crudPm[CRUD_payment_methods]
    crudM[CRUD_memberships]
  end
  loginA --> guardA
  guardA --> crudP
  guardA --> crudPm
  guardA --> crudM
```

```mermaid
flowchart LR
  subgraph publicRides [Public_Ride_Status__no_auth]
    rides[/rides page\]
    wsConnect[Socket_Connect]
    loadProducts[GET /products]
    displayGrid[3-column Grid]
    wsListen[WS_Listener]
    gateOpen[gate_open event]
    gateClose[gate_close event]
  end
  rides --> wsConnect
  rides --> loadProducts
  loadProducts --> displayGrid
  wsConnect --> wsListen
  wsListen --> gateOpen
  wsListen --> gateClose
  gateOpen -->|"Card Hijau"| displayGrid
  gateClose -->|"Card Merah"| displayGrid
```

```mermaid
flowchart TD
  subgraph paymentChange [Change_Payment_Method]
    viewTx[GET /transactions/:id]
    checkStatus{Check status}
    isPending{status = pending?}
    isFailed{status = failed?}
    showChangeBtn[Show "Ganti Metode"]
    selectMethod[Select new payment method]
    callAPI[PATCH /transactions/:id/payment-method]
    showCancelBtn[Show "Cancel" button]
    cancelTx[POST /transactions/:id/cancel]
  end
  viewTx --> checkStatus
  checkStatus --> isPending
  checkStatus --> isFailed
  isPending -->|"yes"| showChangeBtn
  isFailed -->|"yes"| showChangeBtn
  showChangeBtn --> selectMethod
  selectMethod --> callAPI
  isPending -->|"yes"| showCancelBtn
  showCancelBtn --> cancelTx
```

---

## 8. Alur Penggunaan Wahana (Flow Pembelian & IoT Trigger)

### 8.1 Flow Pembelian Wahana

```
Pengunjung berada di area EAL
         │
         ▼
┌─────────────────────────────────┐
│ 1. Pemilihan & Pembayaran      │
│    - Buka aplikasi             │
│    - Pilih tiket Cable Car     │
│    - Pilih metode E-Wallet     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ 2. Transaksi Database          │
│    (Atomic Transaction)        │
│    - Cek saldo E-Wallet        │
│    - Potong saldo E-Wallet     │
│    - Catat transaksi           │
│    - Tambahkan poin membership │
│    - Update QR Code (Akses)    │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ 3. Eksekusi di Lapangan (IoT)  │
│    - Pengunjung scan QR di gate │
│    - Backend validasi tiket    │
│    - Trigger WebSocket         │
│    - gate_open → palang buka   │
│    - Kuota wahana hangus       │
└─────────────────────────────────┘
```

### 8.2 WebSocket Event Mapping

| Event Name       | Payload                                   | Trigger                   |
| ---------------- | ----------------------------------------- | ------------------------- |
| `gate_open`      | `{ userId, productId, transactionId }`    | QR code valid di gate IoT |
| `ticket_scanned` | `{ transactionId, productId, timestamp }` | Gate scanner membaca QR   |
| `quota_exceeded` | `{ productId, remaining }`                | Kapasitas wahana penuh    |

---

## 9. Skema Gagal Bayar (Change Payment Method)

Jika transaksi gagal (timeout, bank down), pengunjung dapat **ganti metode pembayaran** pada invoice yang sama tanpa harus buat ulang keranjang.

### 9.1 Flow

```
Checkout dimulai dengan Metode A (Virtual Account)
         │
         ▼
┌─────────────────────────────────┐
│ Payment Gateway Call           │
│ ❌ Timeout / Bank Down         │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ "Ganti Metode Pembayaran"      │
│ - QRIS                         │
│ - E-Wallet                     │
└─────────────────────────────────┘
         │
         ▼
PATCH /transactions/:id/payment-method
         │
         ▼
Invoice diperbarui, amount sama
```

### 9.2 Validasi

| Kondisi                    | Handling                           |
| -------------------------- | ---------------------------------- |
| Tx sudah `completed`       | **400** - tidak bisa ubah          |
| Tx sudah `cancelled`       | **400** - tidak bisa ubah          |
| Amount berbeda             | **400** - amount lock              |
| Metode baru tidak tersedia | **404** - payment method not found |

---

## 10. Reporting Profit & Loss (PnL)

### 10.1 Data Model Extension

Di tabel `products`, tambahkan field opsional untuk HPP:

| Field              | Tipe    | Deskripsi                                  |
| ------------------ | ------- | ------------------------------------------ |
| `cost_price`       | decimal | Harga pokok (biaya operasional + asuransi) |
| `operational_cost` | decimal | Biaya perawatan per transaksi              |

### 10.2 Perhitungan Margin

```
Revenue = SUM(transaction_items.unit_price * qty)
HPP = SUM(products.cost_price * transaction_items.qty)
Gross Profit = Revenue - HPP
Margin % = (Gross Profit / Revenue) * 100
```

### 10.3 Contoh Perhitungan

| Produk            | Harga Jual | HPP       | Margin |
| ----------------- | ---------- | --------- | ------ |
| Suspension Bridge | Rp 50.000  | Rp 10.000 | 80%    |
| Cable Car         | Rp 75.000  | Rp 15.000 | 80%    |

---

## 11. Components

| Nama                  | Path contoh (repo FE)                                        | Kelompok     | Deskripsi                                                                |
| --------------------- | ------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------ | ------------ | ---------- |
| RoleGate              | `src/features/auth/components/RoleGate.tsx`                  | Auth         | Render children jika role OK                                             |
| RegisterForm          | `src/features/auth/components/RegisterForm.tsx`              | Auth         | Signup `member`                                                          |
| LoginForm             | `src/features/auth/components/LoginForm.tsx`                 | Auth         | Login                                                                    |
| AdminProductTable     | `src/features/admin/components/AdminProductTable.tsx`        | Admin        | CRUD produk admin                                                        |
| AdminPaymentTable     | `src/features/admin/components/AdminPaymentTable.tsx`        | Admin        | CRUD metode bayar                                                        |
| AdminMembershipTable  | `src/features/admin/components/AdminMembershipTable.tsx`     | Admin        | CRUD membership + pilih user                                             |
| AdminWalletTable      | `src/features/admin/components/AdminWalletTable.tsx`         | Admin        | Tabel wallet semua user + admin top-up                                   |
| ProductList           | `src/features/checkout/components/ProductList.tsx`           | Checkout     | Grid produk member                                                       |
| RideStatusCard        | `src/features/rides/components/RideStatusCard.tsx`           | Rides        | Card 3 kolom: nama wahana, harga, status gate Hijau/Merah                |
| GateStatusBadge       | `src/features/rides/components/GateStatusBadge.tsx`          | Rides        | Badge status gate: Hijau (#22c55e) = open, Merah (#ef4444) = closed/idle |
| WalletTopUpForm       | `src/features/wallet/components/WalletTopUpForm.tsx`         | Wallet       | Input nominal top-up                                                     |
| PaymentMethodSelector | `src/features/checkout/components/PaymentMethodSelector.tsx` | Checkout     | Dropdown/radio untuk pilih payment method di checkout                    |
| CheckoutSummary       | `src/features/checkout/components/CheckoutSummary.tsx`       | Checkout     | Ringkasan checkout                                                       |
| TransactionDetail     | `src/features/transactions/components/TransactionDetail.tsx` | Transactions | Detail transaksi + cancel button + ganti metode                          |
| ReportTabs            | `src/features/reports/components/ReportTabs.tsx`             | Reports      | Tab component: Revenue                                                   | Transactions | Membership |
| ReportsTable          | `src/features/reports/components/ReportsTable.tsx`           | Reports      | Transaksi                                                                |
| PnLCard               | `src/features/reports/components/PnLCard.tsx`                | Reports      | Ringkasan PnL                                                            |
| AppShell              | `src/components/blocks/app-shell.tsx`                        | Layout       | Nav member vs admin                                                      |
| Button / Card         | `src/components/ui/*`                                        | UI           | Primitif shadcn/ui                                                       |

---

## 12. State Management & Data Fetching

### Server State (TanStack Query)

- Gunakan **TanStack Query** untuk semua data fetching dari API
- Konfigurasi global: `staleTime`, `gcTime`, `retry`
- Optimistic updates untuk mutations (checkout, topup, cancel)
- Query keys: `['products']`, `['wallet']`, `['transactions']`, dll.

### Client State (Zustand / Context API)

- **Zustand store** untuk auth state (user, role, token)
- **Context API** untuk theme (dark/light mode) jika perlu
- **React Hook Form** + **Zod** untuk semua form validation
  - `useForm` dari react-hook-form
  - `zodSchema` untuk type-safe validation

### Socket.io (Real-time)

- Hook dedikasi: `useGateSocket` - global connection
- Events: `gate_open`, `gate_close`, `ticket_scanned`, `quota_exceeded`
- Auto-reconnect dengan exponential backoff

### Role-based Routing

- Baca `role` dari Zustand auth store atau API `/me`
- Proteksi rute di FE via middleware/higher-order component
- **BE selalu memutuskan** - jangan hanya andalkan penyembunyian UI

### Type Definitions

```ts
export type UserRole = "admin" | "member";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
```

Cuplikan tipe (FE):

```ts
export type UserRole = "admin" | "member";
export interface SessionUser {
  id: string;
  role: UserRole;
}
```

**Struktur folder FE (Next.js 16 App Router)**

```
frontend/
  src/
    app/                        # Routing & Server Components (Next.js App Router)
    │   ├── (auth)/             # Route Group untuk login/register
    │   │   ├── login/
    │   │   └── register/
    │   ├── (dashboard)/        # Route Group untuk aplikasi utama
    │   │   ├── wallet/
    │   │   ├── checkout/
    │   │   ├── transactions/
    │   │   ├── reports/
    │   │   ├── rides/
    │   │   └── admin/         # Admin pages (products, payment-methods, memberships)
    │   ├── api/               # Route Handlers (Backend proxy jika perlu)
    │   ├── layout.tsx         # Root layout & providers
    │   └── page.tsx           # Landing/redirect
    components/                 # UI Components (Reusable)
    │   ├── ui/                # Base components dari shadcn/ui
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   └── ...
    │   ├── blocks/             # Gabungan beberapa UI (Navbar, Sidebar, AppShell)
    │   │   ├── app-shell.tsx
    │   │   ├── sidebar.tsx
    │   │   └── header.tsx
    │   └── shared/             # Komponen kecil yang dipakai lintas fitur
    │       ├── loading-spinner.tsx
    │       └── error-boundary.tsx
    features/                   # Business Logic per Modul
    │   ├── auth/              # Auth feature
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── services/
    │   │   └── types.ts
    │   ├── wallet/             # Wallet feature
    │   ├── checkout/          # Checkout feature
    │   ├── rides/              # Rides feature
    │   └── reports/            # Reports feature
    hooks/                      # Global hooks
    │   ├── use-gate-socket.ts
    │   ├── use-local-storage.ts
    │   └── use-media-query.ts
    lib/                        # Third-party configurations
    │   ├── api-client.ts
    │   ├── socket-client.ts
    │   ├── utils.ts
    │   └── cn.ts
    store/                      # Global state (Zustand)
    │   ├── auth-store.ts
    │   └── ui-store.ts
    styles/                     # Global CSS & Tailwind
    │   └── globals.css
    types/                      # Global TypeScript definitions
        ├── api.ts
        └── index.ts
```

**Struktur folder BE (clean layering + unified service + split controllers)**

```
backend/src/
├── main.ts                              # Fastify + security + swagger bootstrap
├── app.module.ts                        # Root module
├── common/
│   ├── logger/
│   │   └── winston.logger.ts           # WinstonLogger (nest-winston)
│   ├── filters/
│   │   └── all-exceptions.filter.ts    # Global exception filter
│   ├── interceptors/
│   │   └── logging.interceptor.ts       # Request/response logging
│   ├── guards/
│   │   ├── auth.guard.ts               # Token validation
│   │   └── roles.guard.ts              # Role-based access
│   └── decorators/
│       ├── roles.decorator.ts           # @Roles('admin')
│       └── current-user.decorator.ts   # @CurrentUser()
├── infrastructure/
│   ├── database/
│   │   ├── database.module.ts          # Drizzle connection
│   │   ├── schema.ts                  # All entity schemas
│   │   └── seed.ts                    # Seed data script
│   └── redis/
│       └── redis.module.ts             # Redis module + RedisService
├── modules/
│   └── {module_name}/
│       ├── {module_name}.module.ts
│       ├── controllers/
│       │   ├── {module_name}.admin.controller.ts
│       │   └── {module_name}.member.controller.ts
│       ├── services/
│       │   └── {module_name}.service.ts    # UNIFIED service
│       ├── repository/
│       │   └── {module_name}.repository.ts
│       └── dto/
│           ├── index.ts
│           ├── request/
│           └── response/
├── router/
│   ├── router.module.ts                # Aggregates route modules
│   └── routes/
│       ├── routes.admin.module.ts       # Admin route aggregation
│       └── routes.member.module.ts      # Member route aggregation
└── events/
    ├── events.module.ts
    └── events.gateway.ts               # WebSocket + Redis adapter
```

---

## 13. Edge Cases

| Skenario                             | Handling                                                           |
| ------------------------------------ | ------------------------------------------------------------------ |
| Saldo tidak cukup                    | Tx abort; error 400/402 terstandarisasi                            |
| Dua checkout paralel                 | Row lock / `SELECT FOR UPDATE` pada wallet atau serialisasi di tx  |
| Top-up paralel dengan checkout       | Kunci wallet konsisten di kedua use case agar saldo tidak korup    |
| Top-up amount tidak valid            | **400** untuk ≤ 0/bukan angka; batas atas opsional (asumsi demo)   |
| Gagal setelah commit sebelum emit WS | Kompen transaksi atau retry emit + idempotency (catat di asumsi)   |
| PATCH payment-method untuk tx final  | Validasi status masih bisa diubah                                  |
| Member memanggil `/admin/*`          | **403** konsisten; FE redirect atau halaman tidak sah              |
| Admin menghapus produk terpakai      | **409** atau soft-delete; jangan orphan `transaction_items`        |
| POST membership duplikat `user_id`   | **409** (unique violation); pesan jelas                            |
| DELETE membership user aktif         | Produk putuskan: izinkan + `/membership` kosong, atau **409** blok |

### Error Messages

- Pesan user-facing dari kode error backend; FE menampilkan toast tanpa expose detail DB; **403** untuk akses role salah.

---

## 14. Acceptance Criteria

### Foundation

- [ ] Fastify adapter configured
- [ ] Security middleware active (helmet, cors, csrf, rate-limit, compression)
- [ ] Winston logger replaces default logger
- [ ] AllExceptionsFilter logs all errors
- [ ] Redis module configured

### Authentication

- [ ] Member can register (auto-create wallet + membership)
- [ ] Member can login
- [ ] Member can logout
- [ ] Invalid credentials returns 401

### Products

- [ ] Member can GET active products
- [ ] Admin can CRUD all products
- [ ] Soft delete for products with transactions

### Payment Methods

- [ ] Member can GET active payment methods
- [ ] Admin can CRUD payment methods

### Membership

- [ ] Member can GET own membership
- [ ] Admin can GET all memberships
- [ ] Admin can update tier/points

### Wallet

- [ ] Member can GET balance
- [ ] Member can topup
- [ ] Admin can GET all wallets
- [ ] Admin can topup any user

### Transactions

- [ ] Member can checkout
- [ ] Balance deducted on checkout
- [ ] Points added to membership
- [ ] Member can view transaction history
- [ ] Member can cancel pending transaction
- [ ] Admin can view all transactions

### Reports

- [ ] Admin can view revenue report
- [ ] Admin can view transaction report
- [ ] Admin can view membership report

### Events (WebSocket)

- [ ] WebSocket server starts
- [ ] Redis adapter configured
- [ ] Client connection/disconnection handled

### CI/CD

- [ ] CI pipeline runs on push
- [ ] CD pipeline deploys to VPS
- [ ] Health check verified

### General

- [ ] Repo backend dan frontend terpisah; tidak ada `pnpm-workspace.yaml` yang menggabungkan keduanya.
- [ ] Swagger mencakup endpoint bisnis utama.
- [ ] Checkout gagal → tidak ada perubahan wallet/transaksi/poin.
- [ ] Checkout sukses → event WS terkirim ke klien FE demo.
- [ ] `/reports/pnl` memakai agregasi SQL (`SUM`).
- [ ] **`admin`** dapat set **`cost_price`** dan **`operational_cost`** saat create/update produk.
- [ ] Laporan PnL menghitung margin: `revenue - (cost_price * qty)`.
- [ ] Docker multi-stage untuk BE dan FE; README menjelaskan cara jalan lokal dengan Compose DB.
- [ ] CI pada `main`: lint + build untuk masing-masing repo.
- [ ] **`member`** dapat **register**, **login**, **top-up wallet** (saldo bertambah konsisten), **checkout**, dan lihat laporan scoped diri; **`admin`** tidak bypass tanpa role di sesi.
- [ ] **`admin`** dapat CRUD **products**, **payment_methods**, dan **memberships** dari UI + API; non-admin mendapat **403** pada route tersebut.
- [ ] constraint DB **satu membership per user** teruji (POST duplikat gagal).

---

## GitHub Issue

- Epic PRD: _(isi URL issue setelah dibuat)_
- Label disarankan: `backend`, `frontend`, `technical-test`, `priority:P1`.

---

## Catatan Asumsi

1. **Multi-repo:** artefak compose bisa dibagi atau duplikat asalkan aplikasi Nest dan Next tetap di repo berbeda dengan riwayat Git terpisah.
2. **Paket manager:** pnpm atau npm **per repo** boleh; larangan hanya pada **monorepo tunggal** untuk menggabung BE+FE.
3. **Custom Session Auth:** Menggunakan token-based session di database, bukan Better-Auth atau JWT. Token disimpan di `sessions` table dengan expiration.
4. **IoT:** demo boleh satu klien browser sebagai pengganti perangkat fisik; WebSocket events bisa dihandle oleh FE listener.
5. **EAL Ticket Model:** Tiket sepenuhnya digital (Dynamic QR Code) terikat membership. Tidak ada tiket fisik.
6. **E-Wallet Priority:** E-Wallet EAL adalah closed-loop payment yang lebih cepat dari payment gateway eksternal untuk transaksi di dalam kawasan.
7. **Checkout oleh `admin`**: secara default **ditolak** (`member`-only); admin tidak checkout dari sistem.
8. **Soft Delete Products:** Jika product masih direferensikan di `transaction_items`, delete akan改为 soft delete (`is_active = 0`) daripada hard delete.
9. **Membership admin CRUD**: `memberships.user_id` adalah **UNIQUE** index; layanan admin validasi referensi `user_id` ke `users` sebelum POST.
10. **Top-up:** tidak ada payment gateway asli — **simulasi kredit** untuk technical test; ledger terpisah (`wallet_ledger`) opsional jika ingin audit trail tanpa mengubah scope checkout.
11. **Change Payment Method:** Endpoint `PATCH /transactions/:id/payment-method` hanya bisa dipanggil untuk tx dengan status `pending` atau `failed`; status `completed`/`cancelled` return **400**.
12. **PnL Reports:** Agregasi SQL menggunakan `SUM(transaction_items.qty * products.cost_price)` sebagai HPP. Jika `cost_price` NULL, produk tidak dihitung di PnL per produk tapi tetap ada di total revenue.
13. **Redis Adapter:** Socket.io menggunakan Redis adapter untuk support multiple instances (horizontal scaling).
14. **Folder Events:** Menggunakan nama `events/` bukan `realtime/` sesuai requirement.
15. **nest-winston:** Winston logger menggantikan default Nest logger; semua error di-log di Exception Filter.

---

## Files to Create/Modify

### New Files — Backend repo

- `docker-compose.yml` (minimal `postgres`, opsional service `api`)
- `Dockerfile`
- `src/**` modules sesama struktur layering (`modules/admin`, guards `roles`)
- `drizzle.config.ts`, folder `drizzle/`
- `.github/workflows/ci.yml`

### Modify Existing Files — Backend repo

- `README.md`, `package.json`, `.env.example`

### New Files — Frontend repo

- `Dockerfile`
- `src/app/(admin)/**`, `src/app/(member)/**` atau setara, komponen domain/ui/auth
- `.github/workflows/ci.yml`

### Modify Existing Files — Frontend repo

- `README.md`, `package.json`, `.env.example`

---
