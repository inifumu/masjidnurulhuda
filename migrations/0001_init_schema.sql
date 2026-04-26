-- Migration number: 0001
-- Tujuan: Inisialisasi Tabel dan Index Utama (Production Safe)

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
-- BAGIAN 4: INDEXING (PERFORMA D1)
-- ==========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_kas_status_tanggal ON kas_masjid (status, tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_masjid_kategori_id ON kas_masjid (kategori_id);
CREATE INDEX IF NOT EXISTS idx_kas_masjid_seksi_id ON kas_masjid (seksi_id);