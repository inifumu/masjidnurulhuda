-- Migration number: 0002
-- Tujuan: Seeding Data Master Awal

-- Seed Admin Utama
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin Utama', 'admin@masjidnurulhuda.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'superadmin');

-- Seed Divisi/Seksi Inti
INSERT INTO seksi_pengurus (nama_seksi) VALUES
('Ketua'), ('Wakil Ketua'), ('Sekretaris'), ('Bendahara'),
('Seksi Pembangunan dan Perawatan Masjid'), ('Seksi Dakwah'), ('Seksi Sosial'),
('Seksi Perlengkapan dan Pembantu Umum'), ('Seksi Rumah Tangga'),
('Seksi Keamanan'), ('Seksi Remaja'), ('Seksi Kesehatan'),
('Seksi Qurban'), ('Muadzin'), ('Marbot'), ('Seksi Zakat');

-- Seed Pos Anggaran
INSERT INTO kategori_kas (nama_kategori, jenis_arus) VALUES
('Infaq Jumat', 'pemasukan'),
('Infaq Kotak Amal', 'pemasukan'),
('Donasi Bebas / Transfer', 'pemasukan'),
('Utilitas (Listrik, Air, Internet)', 'pengeluaran'),
('Honorarium & Kafalah', 'pengeluaran'),
('Konsumsi & Logistik', 'pengeluaran'),
('Pemeliharaan & Infrastruktur', 'pengeluaran'),
('Kegiatan', 'pengeluaran');

-- Seed Periode 
INSERT INTO periode (nama_periode, is_active) VALUES
('Operasional Reguler 2026', 1);