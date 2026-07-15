import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../migrations/0014_reconcile_user_roles.sql", import.meta.url),
  "utf8",
);

test("migration 0014 menambah operational_role dengan allowlist final dan backfill", () => {
  assert.match(migration, /ALTER TABLE users\s+ADD COLUMN operational_role TEXT/i);
  assert.match(migration, /'superadmin'.*'ketua'.*'bendahara'.*'pengurus'/is);
  assert.match(migration, /UPDATE users SET operational_role = role/i);
});

test("migration 0014 murni additive dan tidak membangun ulang parent users", () => {
  assert.doesNotMatch(migration, /CREATE TABLE users_new|DROP TABLE users|DELETE FROM users/i);
  assert.doesNotMatch(migration, /DROP TABLE (kas_masjid|dokumentasi|transaction_audit_events|transaction_idempotency_keys|security_audit_events)/i);
});
