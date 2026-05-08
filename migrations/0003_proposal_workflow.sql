-- Migration number: 0003
-- Tujuan: Penambahan Role Bendahara dan Alur Approval Kas Bertingkat
-- Catatan kompatibilitas D1/SQLite:
-- - Hindari rebuild parent table `users` pada remote non-fresh untuk mencegah FK constraint failure.
-- - Role legacy dinormalisasi in-place, lalu rebuild hanya dilakukan pada `kas_masjid`.
-- - FK dimatikan sementara selama fase rebuild child table.
-- - Seed memakai INSERT OR IGNORE agar idempotent pada environment yang sudah pernah punya akun serupa.

PRAGMA foreign_keys = OFF;

-- ==========================================
-- 1. NORMALISASI ROLE USERS (tanpa rebuild tabel users)
-- ==========================================
UPDATE users
SET role = CASE
    WHEN role IN ('superadmin', 'ketua', 'bendahara', 'pengurus') THEN role
    WHEN role IN ('admin', 'takmir') THEN 'pengurus'
    ELSE 'pengurus'
END;

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

-- Pindahkan data lama (strict legacy-safe untuk remote non-fresh).
-- Sanitasi FK agar referensi selalu valid saat FK diaktifkan kembali:
-- - kategori_id orphan -> fallback ke kategori valid pertama (deterministik by id)
-- - periode_id/seksi_id/created_by orphan -> NULL
-- - status legacy/invalid -> normalisasi ke enum baru (default pending_ketua)
-- - metode_pembayaran invalid -> fallback kas_langsung
INSERT INTO kas_masjid_new (
    id, tipe, jumlah, keterangan, tanggal, kategori_id, periode_id, seksi_id,
    status, metode_pembayaran, created_by, created_at
)
SELECT
    km.id,
    CASE
        WHEN km.tipe IN ('pemasukan', 'pengeluaran') THEN km.tipe
        ELSE 'pemasukan'
    END AS tipe,
    km.jumlah,
    km.keterangan,
    km.tanggal,
    COALESCE(
        (SELECT kk.id FROM kategori_kas kk WHERE kk.id = km.kategori_id),
        (SELECT kk2.id FROM kategori_kas kk2 ORDER BY kk2.id LIMIT 1)
    ) AS kategori_id,
    CASE
        WHEN km.periode_id IS NULL THEN NULL
        WHEN EXISTS (SELECT 1 FROM periode p WHERE p.id = km.periode_id) THEN km.periode_id
        ELSE NULL
    END AS periode_id,
    CASE
        WHEN km.seksi_id IS NULL THEN NULL
        WHEN EXISTS (SELECT 1 FROM seksi_pengurus sp WHERE sp.id = km.seksi_id) THEN km.seksi_id
        ELSE NULL
    END AS seksi_id,
    CASE
        WHEN km.status IN ('approved', 'rejected', 'pending_ketua', 'pending_bendahara') THEN km.status
        WHEN km.status = 'pending' THEN 'pending_ketua'
        ELSE 'pending_ketua'
    END AS status,
    CASE
        WHEN km.metode_pembayaran IN ('kas_langsung', 'reimbursement') THEN km.metode_pembayaran
        ELSE 'kas_langsung'
    END AS metode_pembayaran,
    CASE
        WHEN km.created_by IS NULL THEN NULL
        WHEN EXISTS (SELECT 1 FROM users u WHERE u.id = km.created_by) THEN km.created_by
        ELSE NULL
    END AS created_by,
    km.created_at
FROM kas_masjid km
WHERE EXISTS (SELECT 1 FROM kategori_kas kk);

-- Ganti tabel kas_masjid lama dengan yang baru
DROP TABLE kas_masjid;
ALTER TABLE kas_masjid_new RENAME TO kas_masjid;

-- Rebuild index setelah rename
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

PRAGMA foreign_keys = ON;