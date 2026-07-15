-- Migration number: 0014
-- Tujuan: source role operasional additive setelah migration 0007 no-op.
-- Kolom role legacy dipertahankan untuk kompatibilitas dan foreign-key safety.

ALTER TABLE users
  ADD COLUMN operational_role TEXT
  CHECK(operational_role IN ('superadmin', 'ketua', 'bendahara', 'pengurus'));

UPDATE users SET operational_role = role WHERE operational_role IS NULL;

CREATE INDEX idx_users_operational_role_active
  ON users (operational_role, is_active);
