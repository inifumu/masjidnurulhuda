-- Migration number: 0011
-- Tujuan: Registry idempotency additive untuk mutasi transaksi finansial.

CREATE TABLE transaction_idempotency_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('create_direct', 'submit_proposal', 'approve_ketua', 'approve_bendahara', 'reject', 'void')),
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    transaction_id INTEGER,
    response_status INTEGER,
    response_body TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES kas_masjid(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE (actor_id, operation, idempotency_key)
);

CREATE INDEX idx_transaction_idempotency_created
  ON transaction_idempotency_keys (created_at);
