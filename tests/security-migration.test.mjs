import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../migrations/0013_security_hardening.sql", import.meta.url);

test("migration 0013 menambah persistent login limiter secara additive", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /CREATE TABLE login_rate_limits/i);
  assert.match(migration, /key_hash TEXT PRIMARY KEY/i);
  assert.match(migration, /failure_count INTEGER NOT NULL/i);
  assert.match(migration, /window_started_at INTEGER NOT NULL/i);
  assert.match(migration, /blocked_until INTEGER/i);
  assert.match(migration, /CREATE INDEX[^;]+blocked_until/is);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/i);
});


test("migration 0013 menyiapkan lifecycle akun dan security audit tanpa hard delete", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /ALTER TABLE users\s+ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1/i);
  assert.match(migration, /CREATE TABLE security_audit_events/i);
  assert.match(migration, /actor_id INTEGER/i);
  assert.match(migration, /target_user_id INTEGER/i);
  assert.match(migration, /action TEXT NOT NULL/i);
  assert.doesNotMatch(migration, /DELETE FROM users/i);
});
