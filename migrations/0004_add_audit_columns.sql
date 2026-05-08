-- Migration number: 0004
-- Tujuan: Menambahkan jejak audit (audit trail) untuk mencegah hilangnya tanggal asli proposal

ALTER TABLE kas_masjid ADD COLUMN approved_at DATETIME;