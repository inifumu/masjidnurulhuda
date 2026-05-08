-- Tujuan: Menambahkan kolom token_version untuk server-side session revocation JWT.
-- Caller: server/services/auth.ts, server/middleware/auth.ts, server/api/admin/auth.ts.
-- Dependensi: tabel users (D1/SQLite), migration 0001_init_schema.sql.
-- Main Functions: menambah kolom users.token_version dengan default 0, lalu normalisasi data lama.
-- Side Effects: seluruh user existing mendapatkan token_version awal (0), siap untuk invalidasi sesi berbasis increment.

ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

UPDATE users
SET token_version = 0
WHERE token_version IS NULL;