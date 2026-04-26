-- ==========================================
-- SCRIPT INIT DATABASE MASJID NURUL HUDA
-- ==========================================

-- 1. Hapus tabel lama (urutan drop dibalik agar tidak error foreign key)
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
    role TEXT CHECK(role IN ('superadmin', 'ketua', 'pengurus')) DEFAULT 'pengurus',
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
-- BAGIAN 2: KLASIFIKASI KEUANGAN (UPDATE!)
-- ==========================================

-- Diubah fungsinya menjadi "Pos Anggaran / Chart of Accounts"
CREATE TABLE kategori_kas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_kategori TEXT NOT NULL,
    -- Membantu Frontend untuk filter dropdown (Kategori Pemasukan vs Pengeluaran)
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
    
    -- Relasi Konsolidasi
    kategori_id INTEGER NOT NULL,
    periode_id INTEGER, -- Kosong = Operasional Harian Default
    seksi_id INTEGER,   -- Kosong = Transaksi Kas Langsung (Bendahara)
    
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    metode_pembayaran TEXT CHECK(metode_pembayaran IN ('kas_langsung', 'reimbursement')) DEFAULT 'kas_langsung',
    
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (kategori_id) REFERENCES kategori_kas(id),
    FOREIGN KEY (periode_id) REFERENCES periode(id),
    FOREIGN KEY (seksi_id) REFERENCES seksi_pengurus(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==========================================
-- BAGIAN 4: INDEXING (UNTUK PERFORMA D1)
-- ==========================================

-- Index untuk mempercepat filter tabel kas berdasarkan status & waktu (Gate 1 Requirement)
CREATE INDEX IF NOT EXISTS idx_kas_status_tanggal ON kas_masjid (status, tanggal);

-- Index untuk mempercepat proses login (Gate 1 Requirement)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 🟢 Index BARU untuk mempercepat JOIN dan Laporan (Hasil Audit Codex)
CREATE INDEX IF NOT EXISTS idx_kas_masjid_kategori_id ON kas_masjid (kategori_id);
CREATE INDEX IF NOT EXISTS idx_kas_masjid_seksi_id ON kas_masjid (seksi_id);

-- ==========================================
-- BAGIAN 5: SEEDING DATA AWAL (BERSIH & RELEVAN)
-- ==========================================

-- Seed Admin Utama
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin Utama', 'admin@masjidnurulhuda.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'superadmin');

-- Seed Divisi/Seksi Inti (Disederhanakan untuk contoh)
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

-- Seed Pos Anggaran (Kategori Baru)
INSERT INTO kategori_kas (nama_kategori, jenis_arus) VALUES
('Infaq Jumat', 'pemasukan'),
('Infaq Kotak Amal', 'pemasukan'),
('Donasi Bebas / Transfer', 'pemasukan'),
('Utilitas (Listrik, Air, Internet)', 'pengeluaran'),
('Honorarium & Kafalah', 'pengeluaran'),
('Konsumsi & Logistik', 'pengeluaran'),
('Pemeliharaan & Infrastruktur', 'pengeluaran'),
('Kegiatan', 'pengeluaran');

-- Seed Periode Contoh
INSERT INTO periode (nama_periode, is_active) VALUES
('Operasional Reguler 2026', 1);
