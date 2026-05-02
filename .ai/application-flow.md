# Application Flow

## User Flow

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

## Alur Penggunaan Wahana (Flow Pembelian & IoT Trigger)

### Flow Pembelian Wahana

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

### WebSocket Event Mapping

| Event Name       | Payload                                   | Trigger                   |
| ---------------- | ----------------------------------------- | ------------------------- |
| `gate_open`      | `{ userId, productId, transactionId }`    | QR code valid di gate IoT |
| `ticket_scanned` | `{ transactionId, productId, timestamp }` | Gate scanner membaca QR   |
| `quota_exceeded` | `{ productId, remaining }`                | Kapasitas wahana penuh    |

---

## Skema Gagal Bayar (Change Payment Method)

Jika transaksi gagal (timeout, bank down), pengunjung dapat **ganti metode pembayaran** pada invoice yang sama tanpa harus buat ulang keranjang.

### Flow

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