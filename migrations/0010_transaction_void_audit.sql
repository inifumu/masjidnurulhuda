-- Migration number: 0010
-- Tujuan: Melarang hilangnya transaksi approved dengan status void dan audit event.
-- Data existing dipertahankan; event historis tidak direkonstruksi.

PRAGMA foreign_keys = OFF;

CREATE TABLE kas_masjid_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipe TEXT CHECK(tipe IN ('pemasukan', 'pengeluaran')) NOT NULL,
    jumlah REAL NOT NULL,
    keterangan TEXT NOT NULL,
    tanggal DATE NOT NULL,
    kategori_id INTEGER NOT NULL,
    periode_id INTEGER,
    seksi_id INTEGER,
    status TEXT CHECK(status IN ('pending_ketua', 'pending_bendahara', 'approved', 'rejected', 'void')) DEFAULT 'pending_ketua',
    metode_pembayaran TEXT CHECK(metode_pembayaran IN ('kas_langsung', 'reimbursement')) DEFAULT 'kas_langsung',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    voided_at DATETIME,
    voided_by INTEGER,
    void_reason TEXT,
    FOREIGN KEY (kategori_id) REFERENCES kategori_kas(id),
    FOREIGN KEY (periode_id) REFERENCES periode(id),
    FOREIGN KEY (seksi_id) REFERENCES seksi_pengurus(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (voided_by) REFERENCES users(id),
    CHECK (
      (status = 'void' AND voided_at IS NOT NULL AND voided_by IS NOT NULL AND length(trim(void_reason)) BETWEEN 10 AND 500)
      OR
      (status <> 'void' AND voided_at IS NULL AND voided_by IS NULL AND void_reason IS NULL)
    )
);

INSERT INTO kas_masjid_new (
    id, tipe, jumlah, keterangan, tanggal, kategori_id, periode_id, seksi_id,
    status, metode_pembayaran, created_by, created_at, approved_at
)
SELECT
    id, tipe, jumlah, keterangan, tanggal, kategori_id, periode_id, seksi_id,
    status, metode_pembayaran, created_by, created_at, approved_at
FROM kas_masjid;

DROP TABLE kas_masjid;
ALTER TABLE kas_masjid_new RENAME TO kas_masjid;

CREATE INDEX idx_kas_status_tanggal ON kas_masjid (status, tanggal);
CREATE INDEX idx_kas_masjid_kategori_id ON kas_masjid (kategori_id);
CREATE INDEX idx_kas_masjid_seksi_id ON kas_masjid (seksi_id);
CREATE INDEX idx_kas_masjid_status_created ON kas_masjid (status, created_at);
CREATE INDEX idx_kas_masjid_creator_status ON kas_masjid (created_by, status, created_at);

CREATE TABLE transaction_audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('created', 'submitted', 'approved_ketua', 'approved_bendahara', 'rejected', 'voided')),
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_id INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES kas_masjid(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_transaction_audit_transaction_created
  ON transaction_audit_events (transaction_id, created_at DESC);
CREATE INDEX idx_transaction_audit_actor_created
  ON transaction_audit_events (actor_id, created_at DESC);

PRAGMA foreign_keys = ON;
