-- Migration number: 0016
-- Safe media deletion: tombstone lifecycle, reference registry, and durable object-deletion outbox.
ALTER TABLE dokumentasi ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'pending_delete', 'deleted', 'delete_failed'));
ALTER TABLE dokumentasi ADD COLUMN deletion_requested_at DATETIME;
ALTER TABLE dokumentasi ADD COLUMN deleted_at DATETIME;
ALTER TABLE dokumentasi ADD COLUMN deletion_error TEXT;

CREATE TABLE media_references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL,
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (owner_type, owner_id, field_name),
  FOREIGN KEY (media_id) REFERENCES dokumentasi(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX idx_media_references_media ON media_references(media_id);

CREATE TABLE media_deletion_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (media_id, storage_key),
  FOREIGN KEY (media_id) REFERENCES dokumentasi(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX idx_media_deletion_outbox_pending ON media_deletion_outbox(status, next_attempt_at, id);
CREATE INDEX idx_dokumentasi_active_created ON dokumentasi(status, created_at DESC);
