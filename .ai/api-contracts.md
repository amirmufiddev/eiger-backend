# API Contracts & Endpoints

## Standar Response

Semua response API harus mengikuti format baku ini:

```typescript
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
```

## Daftar Endpoint Public

- `POST /auth/register` - Register member baru
- `POST /auth/login` - Login

## Daftar Endpoint Member (Dibutuhkan Token)

- `POST /auth/logout` - Logout
- `GET /products` - Get semua product aktif
- `GET /payment-methods` - Get payment methods aktif
- `GET /membership/profile` - Get profile membership sendiri
- `GET /wallet/balance` - Get wallet balance
- `POST /wallet/topup` - Topup saldo (tolak amount ≤ 0)
- `POST /transactions/checkout` - Checkout atomik
- `GET /transactions` - Get history transaksi sendiri
- `GET /transactions/:id` - Get detail transaksi
- `POST /transactions/:id/cancel` - Cancel transaksi pending

## Daftar Endpoint Admin (Dibutuhkan Role Admin)

- `GET /admin/products` - Get semua product (termasuk inactive)
- `POST /admin/products` - Create product
- `PATCH /admin/products/:id` - Update product
- `DELETE /admin/products/:id` - Delete product (soft delete jika ada referensi)
- `GET /admin/payment-methods` - Get semua payment method
- `POST /admin/payment-methods` - Create payment method
- `PATCH /admin/payment-methods/:id` - Update payment method
- `DELETE /admin/payment-methods/:id` - Delete payment method
- `GET /admin/membership` - Get semua membership
- `PATCH /admin/membership/:id` - Update tier/points
- `GET /admin/wallet` - Get semua wallet
- `POST /admin/wallet/:userId/topup` - Topup wallet user lain
- `GET /admin/transactions` - Get semua transaksi
- `GET /admin/reports/revenue` - Revenue report
- `GET /admin/reports/transactions` - Transaction report
- `GET /admin/reports/membership` - Membership report

## Contoh Payload Krusial

**Admin Create Product Request:**

```json
{ "name": "Tiket A", "price": 75000, "cost_price": 15000, "operational_cost": 5000 }
```

**Member Top-up Request:**

```json
{ "amount": 50000 }
```

**Checkout Request:**

```json
{ "productIds": [{ "id": "...", "qty": 1 }], "paymentMethodId": "..." }
```

