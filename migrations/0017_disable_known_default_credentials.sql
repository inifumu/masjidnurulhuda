-- Migration number: 0017
-- Menonaktifkan akun yang masih memakai credential default historis yang diketahui publik.
-- Akun dengan password yang telah dirotasi tidak berubah.

UPDATE users
SET is_active = 0,
    token_version = COALESCE(token_version, 0) + 1
WHERE password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
