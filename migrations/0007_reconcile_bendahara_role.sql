-- Migration number: 0007
-- Tujuan:
-- - PENAMBAHAN role `bendahara` pada constraint kolom `users.role` di DB live.
-- - Tidak memakai mapping role legacy spekulatif.
-- - Menghindari rebuild/drop parent table `users` yang sebelumnya memicu FK failure di D1 remote.
--
-- Caller:
-- - wrangler d1 migrations apply --remote (CI/CD)
--
-- Dependensi:
-- - tabel users sudah ada dari migration sebelumnya
--
-- Main steps:
-- 1) Patch definisi CHECK constraint users.role langsung di sqlite_master
-- 2) Normalisasi minimal data NULL -> 'pengurus'
--
-- Side effects:
-- - mengubah metadata schema (`sqlite_master`) untuk tabel users
-- - tidak mengubah relasi FK tabel lain

PRAGMA writable_schema = ON;

UPDATE sqlite_master
SET sql = REPLACE(
  sql,
  "role TEXT NOT NULL CHECK(role IN ('superadmin','ketua','pengurus'))",
  "role TEXT NOT NULL CHECK(role IN ('superadmin','ketua','bendahara','pengurus'))"
)
WHERE type = 'table'
  AND name = 'users'
  AND sql LIKE "%CHECK(role IN ('superadmin','ketua','pengurus'))%";

PRAGMA writable_schema = OFF;

-- Trigger schema reload
PRAGMA schema_version = schema_version + 1;

-- Normalisasi minimal data role kosong (bukan mapping role halu)
UPDATE users
SET role = 'pengurus'
WHERE role IS NULL;