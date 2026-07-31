-- Additive transaction title contract. Existing rows preserve their legacy text exactly.
ALTER TABLE kas_masjid ADD COLUMN keperluan TEXT;

UPDATE kas_masjid
SET keperluan = keterangan
WHERE keperluan IS NULL;
