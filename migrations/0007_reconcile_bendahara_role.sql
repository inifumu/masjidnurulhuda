-- Migration number: 0007
-- Tujuan:
-- - PENAMBAHAN role `bendahara` pada constraint kolom `users.role` di DB live.
-- - Kompatibel D1 remote (tanpa PRAGMA writable_schema / edit sqlite_master).
-- - Tanpa mapping role legacy spekulatif.
--
-- Caller:
-- - wrangler d1 migrations apply --remote (CI/CD)
--
-- Dependensi:
-- - tabel users sudah ada dari migration sebelumnya
--
-- Main steps:
-- 1) Rebuild tabel users dengan CHECK role baru (include bendahara)
-- 2) Copy data existing dengan normalisasi minimal role NULL -> pengurus
-- 3) Rename table + restore index penting
--
-- Side effects:
-- - lock tulis sementara saat migrasi users
-- - tidak mengubah alur bisnis selain allowlist role

PRAGMA foreign_keys=OFF;

CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('superadmin','ketua','bendahara','pengurus')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_new (id, nama, email, password, role, created_at)
SELECT
  id,
  nama,
  email,
  password,
  CASE
    WHEN role IS NULL THEN 'pengurus'
    ELSE role
  END AS role,
  created_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

PRAGMA foreign_keys=ON;