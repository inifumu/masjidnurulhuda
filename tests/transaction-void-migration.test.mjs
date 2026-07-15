/**
 * Kontrak migration P0.1: void mempertahankan transaksi dan menambah audit event.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readMigration = (name) =>
  readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8");

test("migration void menambah status void, metadata pembatalan, dan audit event", async () => {
  const migration = await readMigration("0010_transaction_void_audit.sql");

  assert.match(migration, /CREATE TABLE kas_masjid_new/i);
  assert.match(migration, /'void'/i);
  assert.match(migration, /voided_at\s+DATETIME/i);
  assert.match(migration, /voided_by\s+INTEGER/i);
  assert.match(migration, /void_reason\s+TEXT/i);
  assert.match(migration, /INSERT INTO kas_masjid_new/i);
  assert.match(migration, /FROM kas_masjid/i);
  assert.match(migration, /CREATE TABLE transaction_audit_events/i);
  assert.match(migration, /actor_id\s+INTEGER\s+NOT NULL/i);
  assert.match(migration, /reason\s+TEXT/i);
});
