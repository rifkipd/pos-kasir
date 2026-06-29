# Desain: Website POS / Kasir

**Tanggal:** 2026-06-29
**Status:** Disetujui (brainstorming)

## Tujuan

Membangun aplikasi web POS (Point of Sale) untuk **satu toko** dengan empat
kemampuan inti:

1. Manajemen produk (CRUD)
2. Transaksi kasir dengan perhitungan total & kembalian otomatis
3. Cetak struk (printer thermal ESC/POS)
4. Laporan penjualan dasar

Aplikasi dibangun sebagai satu basis kode yang performanya ringan dan murah
di-hosting, dengan fondasi yang gampang di-upgrade (ke MySQL/PostgreSQL,
multi-cabang, atau PWA/mobile) tanpa menulis ulang.

## Lingkup (Scope)

**Termasuk:**
- 1 toko, 1 jenis login sederhana (akses penuh)
- Produk, transaksi, struk thermal, laporan dasar

**Tidak termasuk (YAGNI untuk sekarang):**
- Diskon, pajak/PPN
- Data pelanggan
- Multi-cabang / sinkronisasi
- Multi-peran (admin vs kasir)
- Offline/PWA & aplikasi mobile native

Semua item "tidak termasuk" dapat ditambahkan nanti tanpa membongkar fondasi.

## Tech Stack

| Lapisan | Teknologi | Alasan |
|---|---|---|
| Bahasa | **TypeScript** | Satu bahasa depan-belakang, lebih sedikit bug |
| Framework | **Next.js (React)** | Full-stack (UI + API jadi satu), cepat, mudah di-PWA-kan nanti |
| Styling | **Tailwind CSS** | Bikin UI rapi & cepat |
| Komponen UI | **shadcn/ui** | Komponen siap pakai untuk dashboard kasir |
| Database | **SQLite** | 1 file, ringan, tanpa server DB; mudah backup (copy file) |
| ORM | **Prisma** | Query aman + migrasi; pindah ke MySQL/Postgres cukup ganti config |
| Grafik | **Recharts** | Grafik penjualan sederhana |
| Cetak struk | Render HTML 80mm → print driver (cara A) | Mulai sederhana; siap pindah ke ESC/POS murni (cara B) nanti |
| Hosting | Vercel Free + (DB ikut app) | Mulai Rp0; bisa pindah VPS murah (~Rp50rb/bln) |

**Arah visual:** mengikuti skill **`minimalist-ui`** (paket taste-skill) —
gaya editorial bersih, monokrom hangat, bento-grid, datar, kontras tipografi.
Tujuannya: mudah dibaca kasir berjam-jam dan tidak terlihat "generic AI".
Skill ini diterapkan pada fase implementasi UI (perlu di-install via `/plugin`
terlebih dahulu).

## Arsitektur

```
Browser (Next.js + React + Tailwind + shadcn/ui)
   Halaman: Login · Kasir · Produk · Laporan
        | panggil API (fetch)
        v
Next.js API Routes (TypeScript)
   Logika: auth, CRUD produk, simpan transaksi + hitung,
           kurangi stok, tarik laporan
        | Prisma
        v
SQLite (file lokal)

Cetak struk: browser merender struk 80mm -> print via driver printer thermal
```

Satu basis kode Next.js menampung frontend + backend. Database SQLite berupa
satu file sehingga backup = menyalin file.

### Catatan cetak thermal

Browser tidak bisa bicara langsung ke printer thermal. Dua pendekatan:

- **Cara A (dipakai dulu):** printer thermal di-install sebagai printer di OS;
  aplikasi merender struk HTML berukuran 80mm lalu memanggil `print()`. Jalan
  dengan hampir semua printer, paling sederhana.
- **Cara B (nanti bila perlu):** kirim byte ESC/POS via WebUSB atau agen lokal
  kecil. Lebih presisi & cepat, tapi lebih teknis.

Kode struk dipisah agar berpindah dari A ke B tidak mengubah logika transaksi.

## Model Data

```
Product                 Transaction
- id                    - id
- name                  - invoiceNo
- sku/barcode           - createdAt
- price                 - totalAmount
- stock                 - paidAmount
- category              - changeAmount   (kembalian)
- isActive              - paymentMethod
       \                       /
        \                     /
         v                   v
        TransactionItem
        - id
        - transactionId  -> Transaction
        - productId      -> Product
        - quantity
        - priceAtSale    (harga saat dibeli; laporan tetap akurat
        - subtotal        walau harga produk berubah)

User
- id
- username
- passwordHash
```

**Keputusan penting:**
- `priceAtSale` disimpan per item agar laporan historis tetap akurat saat harga
  produk berubah.
- Stok produk berkurang otomatis saat transaksi tersimpan (dalam satu transaksi
  DB agar konsisten).

## Fitur per Halaman

### 1. Login
Form username + password sederhana → masuk aplikasi. Password disimpan ter-hash.

### 2. Kasir (layar utama)
- Cari/scan produk; klik produk → masuk keranjang.
- **Total terhitung otomatis** dari item keranjang.
- Input uang bayar → **kembalian otomatis**.
- Tombol **Bayar & Cetak**: simpan transaksi, kurangi stok, cetak struk.

```
+--------------------------+----------------------+
| Cari/scan produk...      |  KERANJANG           |
| [Kopi][Teh][Roti]        |  Kopi  x2   20.000   |
| [ .. ][ .. ][ .. ]       |  Roti  x1    8.000   |
|                          |  Total      28.000   |
|                          |  Bayar  [ 50.000 ]   |
|                          |  Kembali    22.000   |
|                          |  [ BAYAR & CETAK ]   |
+--------------------------+----------------------+
```

### 3. Produk (manajemen)
Tabel produk + Tambah/Edit/Hapus. Kelola nama, harga, stok, kategori, barcode,
status aktif.

### 4. Laporan
- Ringkasan: total penjualan hari ini, jumlah transaksi.
- Grafik penjualan harian (Recharts) + filter rentang tanggal.
- Daftar transaksi; klik untuk rincian / cetak ulang struk.

### 5. Cetak Struk
Struk berisi: nama toko, tanggal, no invoice, rincian item, total, bayar,
kembalian. Cara A (render 80mm → print driver thermal).

## Penanganan Error

- Transaksi disimpan dalam satu transaksi DB; jika gagal, stok tidak berkurang.
- Validasi input (harga/stok non-negatif, uang bayar >= total).
- Tidak bisa menjual melebihi stok (atau beri peringatan jelas).
- Pesan error yang ramah di UI, bukan crash.

## Strategi Pengujian

- Unit test untuk logika hitung total & kembalian.
- Unit test untuk pengurangan stok & integritas transaksi (rollback saat gagal).
- Test query laporan (total harian benar).
- Test CRUD produk.

## Jalur Upgrade ke Depan (tidak dikerjakan sekarang)

- **Database:** SQLite → MySQL/PostgreSQL (ganti datasource Prisma).
- **Multi-peran:** tambah field role di User + proteksi rute.
- **Offline/Mobile:** jadikan PWA (Next.js mendukung), simpan data lokal & sync.
- **Diskon/Pajak/Pelanggan:** tambah field & UI terkait.
```
