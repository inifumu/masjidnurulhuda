-- Migration number: 0005
-- Tujuan: Mempercepat query untuk dashboard approval dan riwayat transaksi

CREATE INDEX idx_kas_masjid_status_created ON kas_masjid(status, created_at);
CREATE INDEX idx_kas_masjid_creator_status ON kas_masjid(created_by, status, created_at);