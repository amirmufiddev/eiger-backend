# Edge Cases & Error Handling

## Transaksi & Saldo
*   **Saldo tidak cukup**: Batalkan transaksi (Tx abort), kembalikan HTTP `400` atau `402` secara terstandarisasi
*   **Dua checkout paralel**: Gunakan Row lock atau `SELECT FOR UPDATE` pada wallet, atau serialisasi di dalam transaksi
*   **Top-up paralel dengan checkout**: Kunci (lock) wallet harus konsisten di kedua use case agar saldo tidak korup
*   **Top-up amount tidak valid**: Kembalikan HTTP `400` untuk nominal ≤ 0 atau yang bukan angka

## Penggantian Metode Pembayaran
*   **Status sudah `completed` atau `cancelled`**: Kembalikan HTTP `400` (tidak bisa diubah)
*   **Amount berbeda**: Kembalikan HTTP `400` (amount di-lock)
*   **Metode baru tidak tersedia**: Kembalikan HTTP `404` (payment method not found)

## Keamanan & Relasi Data
*   **Member memanggil endpoint `/admin/*`**: Tolak dengan HTTP `403` konsisten melalui `RolesGuard`
*   **Admin menghapus produk terpakai**: Jangan buat orphan di `transaction_items`. Gunakan soft-delete (`is_active = 0`) atau tolak dengan `409`
*   **POST membership duplikat `user_id`**: Tolak dengan HTTP `409` (unique violation) dan berikan pesan jelas
*   **Checkout oleh admin**: Secara default ditolak (member-only), admin tidak melakukan checkout dari sistem