/**
 * Kontrak migration P0.2: registry idempotency additive dan unik per actor/operation/key.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../migrations/0011_transaction_idempotency.sql", import.meta.url),
  "utf8",
);

test("migration idempotency membuat registry unik additive", () => {
  assert.match(migration, /CREATE TABLE transaction_idempotency_keys/i);
  assert.match(migration, /actor_id INTEGER NOT NULL/i);
  assert.match(migration, /idempotency_key TEXT NOT NULL/i);
  assert.match(migration, /request_hash TEXT NOT NULL/i);
  assert.match(migration, /response_body TEXT/i);
  assert.match(
    migration,
    /UNIQUE\s*\(actor_id, operation, idempotency_key\)/i,
  );
  assert.doesNotMatch(migration, /ALTER TABLE kas_masjid/i);
});
