# POS Kasir

Aplikasi Point of Sale (kasir) satu-toko: manajemen produk, transaksi dengan
perhitungan total & kembalian otomatis, cetak struk thermal, dan laporan
penjualan dasar.

## Tech Stack

- **Next.js** (App Router) + **TypeScript** — frontend & API dalam satu basis kode
- **Tailwind CSS** — styling (arah visual minimalist)
- **Prisma 7** + **SQLite** (driver adapter `better-sqlite3`)
- **iron-session** + **bcryptjs** — login sederhana
- **Recharts** — grafik laporan
- **Vitest** — unit test

## Setup

Butuh Node 20+.

```bash
# 1. Install dependency
npm install

# 2. Buat database & skema (SQLite, file dev.db)
npx prisma migrate dev

# 3. Isi data awal (user admin + produk contoh)
npx prisma db seed

# 4. Jalankan server pengembangan
npm run dev
```

Buka http://localhost:3000 — akan diarahkan ke halaman login.

**Login default (dari seed):** `admin` / `admin123`

## Konfigurasi

Variabel di `.env` (tidak di-commit):

```
DATABASE_URL="file:./dev.db"
SESSION_PASSWORD="minimal 32 karakter acak"
```

`SESSION_PASSWORD` wajib diisi dengan string acak minimal 32 karakter
(dipakai untuk mengenkripsi cookie sesi).

## Perintah

```bash
npm run dev     # server pengembangan
npm run build   # build produksi
npm start       # jalankan hasil build
npm test        # jalankan unit test (Vitest)
```

## Struktur

- `src/lib/` — logika bisnis murni & service (money, cart, products,
  transactions, reports, auth) — diuji dengan Vitest
- `src/app/api/` — Route Handlers (JSON API)
- `src/app/` — halaman: `login`, `kasir`, `produk`, `laporan`
- `src/middleware.ts` — proteksi rute (redirect ke `/login` bila belum masuk)
- `prisma/` — skema, migrasi, dan seed

## Halaman

- **Kasir** — pilih produk, total & kembalian otomatis, bayar, cetak struk
- **Produk** — kelola produk (tambah, hapus, daftar)
- **Laporan** — total penjualan, jumlah transaksi, grafik harian, daftar transaksi

## Cetak struk

Struk dirender berukuran 80mm dan dicetak lewat dialog print browser
(`window.print()`), cocok untuk printer thermal yang terpasang sebagai printer
di sistem. Tanggal pada laporan dikelompokkan memakai zona waktu Asia/Jakarta
(WIB).

## Catatan

- Mata uang disimpan sebagai integer rupiah (tanpa desimal) untuk menghindari
  galat pembulatan.
- Database awal memakai SQLite agar ringan; karena memakai Prisma, dapat
  dipindah ke MySQL/PostgreSQL dengan mengubah datasource.
