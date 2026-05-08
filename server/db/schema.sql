-- ==========================================
-- SCRIPT INIT DATABASE MASJID NURUL HUDA (REFERENCE LOCAL RESET)
-- ==========================================
-- Catatan:
-- - File ini adalah reference/reset lokal agar konsisten dengan gabungan migration 0001..0008.
-- - Sinkronisasi ini juga memasukkan patch operasional `fix.sql` (bypass bug Cloudflare D1 remote migration wrapper)
--   sehingga role `bendahara` pada `users` tidak tertinggal saat reset lokal.

PRAGMA foreign_keys = OFF;

-- 1. Hapus tabel lama (urutan drop dibalik agar tidak error foreign key)
DROP TABLE IF EXISTS dokumentasi;
DROP TABLE IF EXISTS kas_masjid;
DROP TABLE IF EXISTS periode;
DROP TABLE IF EXISTS kategori_kas;
DROP TABLE IF EXISTS seksi_pengurus;
DROP TABLE IF EXISTS users;

-- ==========================================
-- BAGIAN 1: PENGGUNA & DIVISI
-- ==========================================

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('superadmin', 'ketua', 'bendahara', 'pengurus')) DEFAULT 'pengurus',
    token_version INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seksi_pengurus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_seksi TEXT NOT NULL,
    nama_pengurus TEXT,
    deskripsi TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- BAGIAN 2: KLASIFIKASI KEUANGAN
-- ==========================================

CREATE TABLE kategori_kas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kategori TEXT NOT NULL,
    jenis_arus TEXT CHECK(jenis_arus IN ('pemasukan', 'pengeluaran', 'general')) DEFAULT 'general'
);

CREATE TABLE periode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_periode TEXT NOT NULL,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    is_active INTEGER DEFAULT 1
);

-- ==========================================
-- BAGIAN 3: JANTUNG KEUANGAN (KAS MASJID)
-- ==========================================

CREATE TABLE kas_masjid (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipe TEXT CHECK(tipe IN ('pemasukan', 'pengeluaran')) NOT NULL,
    jumlah REAL NOT NULL,
    keterangan TEXT NOT NULL,
    tanggal DATE NOT NULL,

    kategori_id INTEGER NOT NULL,
    periode_id INTEGER,
    seksi_id INTEGER,

    status TEXT CHECK(status IN ('pending_ketua', 'pending_bendahara', 'approved', 'rejected')) DEFAULT 'pending_ketua',
    metode_pembayaran TEXT CHECK(metode_pembayaran IN ('kas_langsung', 'reimbursement')) DEFAULT 'kas_langsung',

    created_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (kategori_id) REFERENCES kategori_kas(id),
    FOREIGN KEY (periode_id) REFERENCES periode(id),
    FOREIGN KEY (seksi_id) REFERENCES seksi_pengurus(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==========================================
-- BAGIAN 4: MEDIA LIBRARY (D1 + R2 METADATA)
-- ==========================================

CREATE TABLE dokumentasi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_url TEXT NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    thumb_storage_key TEXT NOT NULL UNIQUE,
    kategori_penggunaan TEXT NOT NULL DEFAULT 'general'
      CHECK (kategori_penggunaan IN ('general', 'artikel', 'profil', 'galeri')),
    alt_text TEXT,
    mime_type TEXT NOT NULL
      CHECK (mime_type IN ('image/webp', 'image/jpeg', 'image/png')),
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    width INTEGER CHECK (width IS NULL OR width > 0),
    height INTEGER CHECK (height IS NULL OR height > 0),
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ==========================================
-- BAGIAN 5: INDEXING (UNTUK PERFORMA D1)
-- ==========================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_kas_status_tanggal ON kas_masjid (status, tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_masjid_kategori_id ON kas_masjid (kategori_id);
CREATE INDEX IF NOT EXISTS idx_kas_masjid_seksi_id ON kas_masjid (seksi_id);
CREATE INDEX IF NOT EXISTS idx_kas_masjid_status_created ON kas_masjid (status, created_at);
CREATE INDEX IF NOT EXISTS idx_kas_masjid_creator_status ON kas_masjid (created_by, status, created_at);

CREATE INDEX IF NOT EXISTS idx_dokumentasi_kategori_created
  ON dokumentasi (kategori_penggunaan, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dokumentasi_created
  ON dokumentasi (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dokumentasi_uploaded_by_created
  ON dokumentasi (uploaded_by, created_at DESC);

-- ==========================================
-- BAGIAN 6: SEEDING DATA AWAL
-- ==========================================

-- Seed Admin Utama
INSERT INTO users (name, email, password_hash, role, token_version) VALUES
('Admin Utama', 'admin@masjidnurulhuda.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'superadmin', 0);

-- Seed akun workflow proposal bertahap (idempotensi reset lokal tetap aman karena fresh schema)
INSERT INTO users (name, email, password_hash, role, token_version) VALUES
('Ketua Masjid', 'ketua@masjidnurulhuda.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'ketua', 0),
('Bendahara Masjid', 'bendahara@masjidnurulhuda.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'bendahara', 0),
('Seksi Dakwah', 'dakwah@masjidnurulhuda.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'pengurus', 0);

-- Seed Divisi/Seksi Inti
INSERT INTO seksi_pengurus (nama_seksi) VALUES
('Ketua'),
('Wakil Ketua'),
('Sekretaris'),
('Bendahara'),
('Seksi Pembangunan dan Perawatan Masjid'),
('Seksi Dakwah'),
('Seksi Sosial'),
('Seksi Perlengkapan dan Pembantu Umum'),
('Seksi Rumah Tangga'),
('Seksi Keamanan'),
('Seksi Remaja'),
('Seksi Kesehatan'),
('Seksi Qurban'),
('Muadzin'),
('Marbot'),
('Seksi Zakat');

-- Seed Pos Anggaran
INSERT INTO kategori_kas (nama_kategori, jenis_arus) VALUES
('Infaq Jumat', 'pemasukan'),
('Infaq Kotak Amal', 'pemasukan'),
('Donasi Bebas / Transfer', 'pemasukan'),
('Utilitas (Listrik, Air, Internet)', 'pengeluaran'),
('Honorarium & Kafalah', 'pengeluaran'),
('Konsumsi & Logistik', 'pengeluaran'),
('Pemeliharaan & Infrastruktur', 'pengeluaran'),
('Kegiatan', 'pengeluaran');

-- Seed Periode
INSERT INTO periode (nama_periode, is_active) VALUES
('Operasional Reguler 2026', 1);

PRAGMA foreign_keys = ON;