-- Migration number: 0007
-- Gunakan defer_foreign_keys agar pengecekan relasi ditunda sampai COMMIT
PRAGMA defer_foreign_keys = ON;

CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('superadmin', 'ketua', 'bendahara', 'pengurus')) DEFAULT 'pengurus',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy semua data yang ada
INSERT INTO users_new (id, name, email, password_hash, role, created_at)
SELECT id, name, email, password_hash, role, created_at FROM users;

-- Sapu bersih orphan data di kas_masjid (mencegah error FK saat commit)
UPDATE kas_masjid SET created_by = NULL WHERE created_by NOT IN (SELECT id FROM users_new);

-- Ganti tabel
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Kembalikan index
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);