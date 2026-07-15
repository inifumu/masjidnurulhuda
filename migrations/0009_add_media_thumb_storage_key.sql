-- Migration number: 0009
-- Tujuan: Menyimpan key thumbnail R2 eksplisit pada metadata dokumentasi.
-- Kompatibilitas: additive; row lama dibackfill mengikuti konvensi key canonical.

ALTER TABLE dokumentasi ADD COLUMN thumb_storage_key TEXT;

UPDATE dokumentasi
SET thumb_storage_key = CASE
  WHEN lower(storage_key) LIKE '%.webp'
    THEN substr(storage_key, 1, length(storage_key) - 5) || '-thumb.webp'
  ELSE storage_key || '-thumb'
END
WHERE thumb_storage_key IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dokumentasi_thumb_storage_key
  ON dokumentasi (thumb_storage_key)
  WHERE thumb_storage_key IS NOT NULL;
