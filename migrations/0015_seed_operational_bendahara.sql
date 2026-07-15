-- Migration number: 0015
-- Tujuan: memastikan fresh migration memiliki akun bendahara operasional.
-- Role legacy tetap pengurus agar kompatibel dengan CHECK users.role lama.

INSERT INTO users (name, email, password_hash, role, operational_role)
SELECT
  'Bendahara Masjid',
  'bendahara@masjidnurulhuda.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'pengurus',
  'bendahara'
WHERE NOT EXISTS (
  SELECT 1 FROM users
  WHERE COALESCE(operational_role, role) = 'bendahara'
);
