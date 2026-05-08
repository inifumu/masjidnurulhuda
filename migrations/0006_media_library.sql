-- Migration number: 0006
-- Tujuan: Menambahkan tabel media library (dokumentasi) untuk metadata object R2 + indeks query list admin
-- Catatan:
-- 1) Hard delete: row D1 akan dihapus sinkron dengan object R2 di fase endpoint DELETE
-- 2) Pagination fase awal: offset (page, limit)
-- 3) Tidak ada checksum/dedup pada fase awal

CREATE TABLE IF NOT EXISTS dokumentasi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_url TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
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

CREATE INDEX IF NOT EXISTS idx_dokumentasi_kategori_created
  ON dokumentasi (kategori_penggunaan, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dokumentasi_created
  ON dokumentasi (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dokumentasi_uploaded_by_created
  ON dokumentasi (uploaded_by, created_at DESC);