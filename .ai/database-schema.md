# Database Schema (Drizzle ORM)

## ERD
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

## Entity Descriptions

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

## Relasi Utama
*   `USERS` (id, email, name, role) memiliki relasi One-to-One dengan `MEMBERSHIPS` dan `WALLETS`
*   `USERS` memiliki relasi One-to-Many dengan `SESSIONS` dan `TRANSACTIONS`
*   `TRANSACTIONS` memiliki relasi One-to-Many dengan `TRANSACTION_ITEMS`
*   `TRANSACTIONS` merujuk ke tabel `PAYMENT_METHODS`
*   `TRANSACTION_ITEMS` merujuk ke tabel `PRODUCTS`

## Daftar Tabel & Kolom Kunci
*   **users**: `id` (uuid, PK), `email` (varchar, UK), `name`, `role` (user_role enum)
*   **sessions**: `id` (uuid, PK), `user_id` (FK), `token` (UK), `expires_at`, `ip_address`, `user_agent`
*   **memberships**: `id` (uuid, PK), `user_id` (FK, UK), `tier`, `points` (integer)
*   **wallets**: `id` (uuid, PK), `user_id` (FK, UK), `balance` (numeric)
*   **products**: `id` (uuid, PK), `name`, `price` (numeric), `cost_price` (numeric, opsional), `operational_cost` (numeric, opsional), `is_active` (integer)
*   **payment_methods**: `id` (uuid, PK), `code` (UK), `name`, `is_active` (integer)
*   **transactions**: `id` (uuid, PK), `user_id` (FK), `payment_method_id` (FK), `status` (transaction_status enum), `total` (numeric)
*   **transaction_items**: `id` (uuid, PK), `transaction_id` (FK), `product_id` (FK), `qty` (integer), `unit_price` (numeric)

## Catatan PnL (Profit & Loss)
*   Agregasi SQL menggunakan `SUM(transaction_items.qty * products.cost_price)` sebagai HPP
*   Jika `cost_price` NULL, produk tidak dihitung di PnL per produk tapi tetap ada di total revenue