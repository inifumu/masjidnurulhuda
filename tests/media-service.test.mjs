/**
 * Tujuan:
 * - Verifikasi kontrak service media untuk rollback parsial saat insert D1 gagal
 *   setelah upload object ke R2 berhasil.
 *
 * Caller:
 * - npm test
 *
 * Dependensi:
 * - node:test
 * - node:assert/strict
 * - server/services/media.ts
 *
 * Main Functions:
 * - menguji uploadMedia melakukan cleanup object original + thumb jika insert gagal.
 *
 * Side Effects:
 * - Tidak ada (semua dependency di-mock in-memory).
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  getMediaList,
  processMediaDeletionOutbox,
  reconcileMediaDeletions,
  uploadMedia,
} from "../server/services/media.ts";

test("uploadMedia: collision tidak menimpa atau menghapus object existing", async () => {
  const putCalls = [];
  const deleteCalls = [];
  const env = {
    DB: { prepare() { throw new Error("D1 tidak boleh disentuh saat collision"); } },
    MEDIA_BUCKET: {
      async put(key, _body, options) { putCalls.push({ key, options }); return null; },
      async delete(key) { deleteCalls.push(key); },
    },
  };
  const file = new File(["original"], "hero.webp", { type: "image/webp" });
  const thumbFile = new File(["thumb"], "hero-thumb.webp", { type: "image/webp" });
  await assert.rejects(() => uploadMedia(env, {
    file, thumbFile, storageKey: "media/existing.webp", thumbStorageKey: "media/existing-thumb.webp",
    category: "galeri", altText: null, width: 10, height: 10, uploadedBy: 7,
  }), /sudah digunakan/i);
  assert.equal(putCalls.length, 1);
  assert.deepEqual(putCalls[0].options.onlyIf, { etagDoesNotMatch: "*" });
  assert.deepEqual(deleteCalls, []);
});

test("uploadMedia: rollback object R2 saat insert metadata D1 gagal", async () => {
  const putCalls = [];
  const deleteCalls = [];

  const env = {
    DB: {
      prepare() {
        return {
          bind() {
            return {
              async first() {
                throw new Error("Simulasi D1 insert gagal");
              },
            };
          },
        };
      },
    },
    MEDIA_BUCKET: {
      async put(key) {
        putCalls.push(key);
        return { key };
      },
      async delete(key) {
        deleteCalls.push(key);
      },
    },
  };

  const file = new File(["original"], "hero.webp", { type: "image/webp" });
  const thumbFile = new File(["thumb"], "hero-thumb.webp", {
    type: "image/webp",
  });

  await assert.rejects(
    () =>
      uploadMedia(env, {
        file,
        thumbFile,
        storageKey: "media/2026/05/hero.webp",
        thumbStorageKey: "media/2026/05/hero-thumb.webp",
        category: "galeri",
        altText: "hero",
        width: 1200,
        height: 800,
        uploadedBy: 7,
      }),
    /Gagal upload media/,
  );

  assert.deepEqual(putCalls, [
    "media/2026/05/hero.webp",
    "media/2026/05/hero-thumb.webp",
  ]);
  assert.deepEqual(deleteCalls, [
    "media/2026/05/hero.webp",
    "media/2026/05/hero-thumb.webp",
  ]);
});

test("getMediaList: guard limit fallback ke default 12 saat limit invalid atau melewati maksimum", async () => {
  const observedBinds = [];

  const env = {
    DB: {
      prepare(sql) {
        if (sql.includes("COUNT(*)")) {
          return {
            async first() {
              return { total: 0 };
            },
            bind() {
              return {
                async first() {
                  return { total: 0 };
                },
              };
            },
          };
        }

        if (sql.includes("FROM dokumentasi")) {
          return {
            bind(...values) {
              observedBinds.push(values);
              return {
                async all() {
                  return { results: [] };
                },
              };
            },
          };
        }

        return {
          bind() {
            return {
              async first() {
                return null;
              },
              async all() {
                return { results: [] };
              },
            };
          },
        };
      },
    },
    MEDIA_BUCKET: {
      async put() {},
      async delete() {},
    },
  };

  const overLimit = await getMediaList(env, {
    page: 1,
    limit: 99,
    category: null,
  });
  const invalidLimit = await getMediaList(env, {
    page: 1,
    limit: 0,
    category: null,
  });
  const validLimit = await getMediaList(env, {
    page: 1,
    limit: 24,
    category: null,
  });

  assert.equal(overLimit.limit, 12);
  assert.equal(invalidLimit.limit, 12);
  assert.equal(validLimit.limit, 24);

  assert.equal(observedBinds[0][0], 12);
  assert.equal(observedBinds[1][0], 12);
  assert.equal(observedBinds[2][0], 24);
});

test("processor deletion melanjutkan partial retry dan finalize tombstone setelah semua key terhapus", async () => {
  const deleted = [];
  const statements = [];
  const env = {
    DB: { prepare(sql) { return { bind(...values) { statements.push({ sql, values }); return {
      async all() { return { results: [{ id: 11, media_id: 4, storage_key: "media/main.webp" }] }; },
      async run() { return { success: true, meta: { changes: 1 } }; },
    }; } }; } },
    MEDIA_BUCKET: { async delete(key) { deleted.push(key); } },
  };
  const result = await processMediaDeletionOutbox(env, { limit: 10 });
  assert.deepEqual(deleted, ["media/main.webp"]);
  assert.equal(result.processed, 1);
  assert.ok(statements.some(({ sql }) => /status = 'deleted'/.test(sql)));
});

test("reconciliation mengembalikan pending tanpa outbox menjadi delete_failed", async () => {
  const calls = [];
  const db = { prepare(sql) { return { bind(...values) { calls.push({ sql, values }); return { async run() { return { meta: { changes: 2 } }; } }; } }; } };
  const result = await reconcileMediaDeletions({ DB: db, MEDIA_BUCKET: {} });
  assert.equal(result.markedFailed, 2);
  assert.match(calls[0].sql, /NOT EXISTS/i);
});
