-- Migration number: 0007
-- Tujuan: Menjamin schema role users mengizinkan role 'bendahara' (schema-only, tanpa update akun spesifik).
-- Strategi:
-- - Rebuild tabel users dengan CHECK role final.
-- - Tidak melakukan normalisasi/mutasi role akun existing.
-- - Tanpa BEGIN/COMMIT eksplisit agar kompatibel dengan D1 remote apply.

CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('superadmin', 'ketua', 'bendahara', 'pengurus')) DEFAULT 'pengurus',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_new (id, name, email, password_hash, role, created_at)
SELECT id, name, email, password_hash, role, created_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
CREATE UNIQUE INDEX idx_users_email ON users (email);