-- Migration number: 0003
-- Tujuan: Penambahan Role Bendahara dan Alur Approval Kas Bertingkat
-- Catatan kompatibilitas D1/SQLite:
-- - Rebuild tabel parent (`users`) dan child (`kas_masjid`) dilakukan dalam 1 transaksi.
-- - FK dimatikan sementara selama fase rebuild untuk menghindari constraint error saat DROP/RENAME.
-- - Seed memakai INSERT OR IGNORE agar idempotent pada environment yang sudah pernah punya akun serupa.

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- ==========================================
-- 1. REBUILD TABEL USERS (Tambah role 'bendahara')
-- ==========================================
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('superadmin', 'ketua', 'bendahara', 'pengurus')) DEFAULT 'pengurus',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data lama ke tabel baru
INSERT INTO users_new (id, name, email, password_hash, role, created_at)
SELECT id, name, email, password_hash, role, created_at
FROM users;

-- ==========================================
-- 2. REBUILD TABEL KAS_MASJID (Ubah status approval)
-- ==========================================
CREATE TABLE kas_masjid_new (
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (kategori_id) REFERENCES kategori_kas(id),
    FOREIGN KEY (periode_id) REFERENCES periode(id),
    FOREIGN KEY (seksi_id) REFERENCES seksi_pengurus(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Pindahkan data lama. Jika ada transaksi yang masih 'pending', otomatis dialihkan ke 'pending_ketua'
INSERT INTO kas_masjid_new (
    id, tipe, jumlah, keterangan, tanggal, kategori_id, periode_id, seksi_id,
    status, metode_pembayaran, created_by, created_at
)
SELECT
    id, tipe, jumlah, keterangan, tanggal, kategori_id, periode_id, seksi_id,
    CASE WHEN status = 'pending' THEN 'pending_ketua' ELSE status END AS status,
    metode_pembayaran, created_by, created_at
FROM kas_masjid;

-- Ganti tabel lama dengan yang baru (child dulu, lalu parent)
DROP TABLE kas_masjid;
ALTER TABLE kas_masjid_new RENAME TO kas_masjid;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Rebuild index setelah rename
CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE INDEX idx_kas_status_tanggal ON kas_masjid (status, tanggal);
CREATE INDEX idx_kas_masjid_kategori_id ON kas_masjid (kategori_id);
CREATE INDEX idx_kas_masjid_seksi_id ON kas_masjid (seksi_id);

-- ==========================================
-- 3. SEED DATA TAMBAHAN (Idempotent)
-- ==========================================
INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES
('Ketua Masjid', 'ketua@masjidnurulhuda.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'ketua'),
('Bendahara Masjid', 'bendahara@masjidnurulhuda.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'bendahara'),
('Seksi Dakwah', 'dakwah@masjidnurulhuda.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'pengurus');

COMMIT;
PRAGMA foreign_keys = ON;