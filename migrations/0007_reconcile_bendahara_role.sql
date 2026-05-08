-- Migration number: 0007
-- Tujuan:
-- - Reconcile schema role `users` agar matrix final eksplisit mengizinkan:
--   superadmin | ketua | bendahara | pengurus
-- - Kompatibel untuk environment D1 non-fresh yang sudah memiliki tabel relasional.
--
-- Caller:
-- - wrangler d1 migrations apply (CI/CD GitHub bot)
--
-- Dependensi:
-- - tabel `users` existing dari migration sebelumnya
-- - index unique `idx_users_email`
--
-- Main steps:
-- 1) nonaktifkan FK sementara
-- 2) rebuild tabel users dengan CHECK role final
-- 3) copy data existing
-- 4) swap table + recreate index
-- 5) aktifkan FK kembali
--
-- Side effects:
-- - struktur tabel users direkonsiliasi, data user tetap dipertahankan.

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS users_new;

CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'pengurus' CHECK(role IN ('superadmin', 'ketua', 'bendahara', 'pengurus')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_new (id, name, email, password, role, created_at)
SELECT
  id,
  name,
  email,
  password,
  role,
  created_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

PRAGMA foreign_keys = ON;