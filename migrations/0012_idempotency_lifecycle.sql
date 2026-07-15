-- Migration number: 0012
-- Tujuan: Lifecycle eksplisit registry idempotency tanpa mengubah migration 0011 yang sudah applied lokal.

ALTER TABLE transaction_idempotency_keys
  ADD COLUMN state TEXT NOT NULL DEFAULT 'processing'
  CHECK(state IN ('processing', 'completed'));

CREATE INDEX idx_transaction_idempotency_state_created
  ON transaction_idempotency_keys (state, created_at);
