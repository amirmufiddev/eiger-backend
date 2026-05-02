# IoT & Realtime Events (WebSocket)

## Konfigurasi Gateway
*   **Lokasi Folder**: Wajib diletakkan di `events/` (bukan `realtime/`)
*   **Adapter**: Menggunakan Redis adapter (`@socket.io/redis-adapter`) untuk mendukung *horizontal scaling* (distributed deployment)

## Daftar Event (Server ke Client / IoT)
*   `gate_open`: 
    *   **Payload**: `{ userId, productId, transactionId }`
    *   **Trigger**: Dipancarkan ketika QR code divalidasi dengan benar di gate IoT
*   `ticket_scanned`:
    *   **Payload**: `{ transactionId, productId, timestamp }`
    *   **Trigger**: Gate scanner membaca QR
*   `quota_exceeded`:
    *   **Payload**: `{ productId, remaining }`
    *   **Trigger**: Kapasitas wahana penuh

## Event Internal / Pembaruan State
*   `transaction:update`: Pembaruan status transaksi
*   `membership:update`: Pembaruan tier/poin membership
*   `wallet:update`: Pembaruan saldo e-wallet
*   `notification`: Event notifikasi general