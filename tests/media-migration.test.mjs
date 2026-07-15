/**
 * Regression contract untuk upgrade schema media thumbnail.
 * Test ini memastikan migration baru menambah kolom tanpa mengubah migration lama.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readMigration = (name) =>
  readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8");

test("migration media thumbnail menambah dan membackfill thumb_storage_key secara kompatibel", async () => {
  const originalMediaMigration = await readMigration("0006_media_library.sql");
  const thumbnailMigration = await readMigration(
    "0009_add_media_thumb_storage_key.sql",
  );

  assert.doesNotMatch(originalMediaMigration, /thumb_storage_key/i);
  assert.match(
    thumbnailMigration,
    /ALTER\s+TABLE\s+dokumentasi\s+ADD\s+COLUMN\s+thumb_storage_key\s+TEXT/i,
  );
  assert.match(thumbnailMigration, /UPDATE\s+dokumentasi/i);
  assert.match(thumbnailMigration, /storage_key/i);
  assert.match(
    thumbnailMigration,
    /CREATE\s+UNIQUE\s+INDEX[^;]+thumb_storage_key/is,
  );
});

test("migration safe deletion additive menyediakan status, registry reference FK restrict, dan outbox", async () => {
  const migration = await readMigration("0016_safe_media_deletion.sql");
  assert.match(migration, /ADD\s+COLUMN\s+status\s+TEXT[^;]+active[^;]+pending_delete[^;]+deleted[^;]+delete_failed/is);
  assert.match(migration, /CREATE\s+TABLE\s+media_references/i);
  assert.match(migration, /REFERENCES\s+dokumentasi\s*\(id\)\s+ON\s+DELETE\s+RESTRICT/i);
  assert.match(migration, /CREATE\s+TABLE\s+media_deletion_outbox/i);
  assert.match(migration, /UNIQUE\s*\(media_id,\s*storage_key\)/i);
});
