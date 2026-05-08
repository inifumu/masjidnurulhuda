/**
 * Tujuan:
 * - Integration test harness route media (admin + public) secara end-to-end minimal
 *   upload -> list -> patch -> delete + fallback legacy thumbnail + request-id propagation.
 *
 * Caller:
 * - npm test
 *
 * Dependensi:
 * - node:test
 * - node:assert/strict
 * - hono/jwt
 * - server/index.ts
 *
 * Main Functions:
 * - verifikasi flow sukses media admin (POST/GET/PATCH/DELETE)
 * - verifikasi request-id konsisten di response
 * - verifikasi fallback key legacy thumbnail pada endpoint publik
 *
 * Side Effects:
 * - Tidak ada (D1/R2 full mock in-memory).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import mediaRouter from "../server/api/admin/media.ts";
import { resolveMediaStorageKey } from "../server/utils/mediaPath.ts";

const JWT_SECRET = "test-secret-media-routes";

const createTestApp = () => {
  const testApp = new Hono();

  testApp.use("*", async (c, next) => {
    const inboundRequestId = c.req.header("x-request-id");
    const requestId =
      inboundRequestId && inboundRequestId.trim()
        ? inboundRequestId.trim()
        : crypto.randomUUID();

    c.set("requestId", requestId);
    c.header("x-request-id", requestId);
    await next();
  });

  testApp.route("/api/admin/media", mediaRouter);

  testApp.get("/api/public/media/*", async (c) => {
    const requestUrl = new URL(c.req.url);
    const storageKey = resolveMediaStorageKey({
      pathname: requestUrl.pathname,
      wildcardPath: c.req.param("*") ?? "",
    });

    if (!storageKey) return c.text("Media key tidak valid", 400);

    const requestId = c.get("requestId") ?? "unknown-request-id";
    let object = await c.env.MEDIA_BUCKET.get(storageKey);

    if (!object && storageKey.endsWith("-thumb.webp")) {
      const legacyThumbKey = storageKey.replace(
        /-thumb\.webp$/i,
        ".thumb.webp",
      );
      object = await c.env.MEDIA_BUCKET.get(legacyThumbKey);

      if (object) {
        c.executionCtx.waitUntil(
          Promise.resolve().then(() => {
            console.info(
              "[media][GET /api/public/media/*] legacy_thumb_fallback_hit",
              {
                route: "/api/public/media/*",
                requestId,
                storageKey,
              },
            );
          }),
        );
      }
    }

    if (!object) return c.text("Media tidak ditemukan", 404);

    return new Response(object.body, {
      status: 200,
      headers: {
        "content-type":
          object.httpMetadata?.contentType ?? "application/octet-stream",
        "cache-control":
          object.httpMetadata?.cacheControl ??
          "public, max-age=31536000, immutable",
        etag: object.httpEtag,
        "x-request-id": requestId,
      },
    });
  });

  return testApp;
};

const createExecutionCtx = () => ({
  waitUntil(promise) {
    return promise;
  },
  passThroughOnException() {},
});

const createInMemoryEnv = () => {
  let autoId = 1;
  const rows = [];
  const objects = new Map();

  const parseId = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  };

  const DB = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();

      return {
        bind(...values) {
          return {
            async first() {
              if (
                normalized.includes("SELECT COUNT(*) AS total FROM dokumentasi")
              ) {
                const category = values[0] ?? null;
                const filtered = category
                  ? rows.filter((r) => r.kategori_penggunaan === category)
                  : rows;
                return { total: filtered.length };
              }

              if (
                normalized.includes("SELECT id, file_url, storage_key") &&
                normalized.includes("FROM dokumentasi") &&
                normalized.includes("WHERE id = ?")
              ) {
                const id = parseId(values[0]);
                if (!id) return null;
                const found = rows.find((r) => r.id === id);
                return found ?? null;
              }

              if (
                normalized.includes("SELECT id, file_url, storage_key") &&
                normalized.includes("FROM dokumentasi") &&
                normalized.includes("WHERE storage_key = ?")
              ) {
                const storageKey = String(values[0] ?? "");
                const found = rows.find((r) => r.storage_key === storageKey);
                return found ?? null;
              }

              if (normalized.includes("INSERT INTO dokumentasi")) {
                const [
                  file_url,
                  storage_key,
                  kategori_penggunaan,
                  alt_text,
                  mime_type,
                  size_bytes,
                  width,
                  height,
                  uploaded_by,
                ] = values;

                const inserted = {
                  id: autoId++,
                  file_url,
                  storage_key,
                  kategori_penggunaan,
                  alt_text,
                  mime_type,
                  size_bytes,
                  width,
                  height,
                  uploaded_by,
                  created_at: new Date().toISOString(),
                };
                rows.push(inserted);
                return inserted;
              }

              if (normalized.startsWith("UPDATE dokumentasi SET")) {
                const [alt_text, kategori_penggunaan, id] = values;
                const parsedId = parseId(id);
                const idx = rows.findIndex((r) => r.id === parsedId);
                if (idx === -1) return null;

                rows[idx] = {
                  ...rows[idx],
                  alt_text,
                  kategori_penggunaan,
                };

                return rows[idx];
              }

              return null;
            },

            async all() {
              if (normalized.includes("FROM dokumentasi")) {
                let filtered = [...rows];

                if (normalized.includes("WHERE kategori_penggunaan = ?")) {
                  const category = values[0];
                  const limit = Number(values[1]);
                  const offset = Number(values[2]);
                  filtered = filtered.filter(
                    (r) => r.kategori_penggunaan === category,
                  );
                  const paged = filtered.slice(offset, offset + limit);
                  return { results: paged };
                }

                const limit = Number(values[0]);
                const offset = Number(values[1]);
                const paged = filtered.slice(offset, offset + limit);
                return { results: paged };
              }

              return { results: [] };
            },

            async run() {
              if (normalized.startsWith("UPDATE dokumentasi SET")) {
                const [alt_text, kategori_penggunaan, id] = values;
                const parsedId = parseId(id);
                const idx = rows.findIndex((r) => r.id === parsedId);
                if (idx === -1) return { success: true, meta: { changes: 0 } };
                rows[idx] = {
                  ...rows[idx],
                  alt_text,
                  kategori_penggunaan,
                };
                return { success: true, meta: { changes: 1 } };
              }

              if (
                normalized.startsWith("DELETE FROM dokumentasi WHERE id = ?")
              ) {
                const parsedId = parseId(values[0]);
                const before = rows.length;
                const next = rows.filter((r) => r.id !== parsedId);
                rows.length = 0;
                rows.push(...next);
                return {
                  success: true,
                  meta: { changes: before - rows.length },
                };
              }

              return { success: true, meta: { changes: 0 } };
            },
          };
        },
      };
    },
  };

  const MEDIA_BUCKET = {
    async put(key, value, options = {}) {
      objects.set(key, {
        body: value,
        httpEtag: `etag-${key}`,
        httpMetadata: options.httpMetadata ?? {},
      });
    },
    async get(key) {
      return objects.get(key) ?? null;
    },
    async delete(key) {
      objects.delete(key);
    },
  };

  return {
    DB,
    MEDIA_BUCKET,
    JWT_SECRET,
    _rows: rows,
    _objects: objects,
  };
};

const makeAuthedCookie = async () => {
  const token = await sign(
    { id: 7, sub: 7, role: "superadmin" },
    JWT_SECRET,
    "HS256",
  );
  return `auth_token=${token}`;
};

test("media routes integration: upload/list/patch/delete + request-id + public legacy fallback", async () => {
  const env = createInMemoryEnv();
  const executionCtx = createExecutionCtx();
  const authCookie = await makeAuthedCookie();
  const app = createTestApp();

  const file = new File(["image-main"], "hero.webp", { type: "image/webp" });
  const thumbFile = new File(["image-thumb"], "hero-thumb.webp", {
    type: "image/webp",
  });

  const uploadForm = new FormData();
  uploadForm.set("file", file);
  uploadForm.set("thumb_file", thumbFile);
  uploadForm.set("storage_key", "media/2026/05/hero.webp");
  uploadForm.set("thumb_storage_key", "media/2026/05/hero-thumb.webp");
  uploadForm.set("kategori_penggunaan", "galeri");
  uploadForm.set("alt_text", "hero awal");
  uploadForm.set("width", "1200");
  uploadForm.set("height", "800");

  const uploadRes = await app.request(
    "http://localhost/api/admin/media",
    {
      method: "POST",
      headers: {
        Cookie: authCookie,
        "x-request-id": "req-media-upload-1",
      },
      body: uploadForm,
    },
    env,
    executionCtx,
  );

  assert.equal(uploadRes.status, 201);
  assert.equal(uploadRes.headers.get("x-request-id"), "req-media-upload-1");
  const uploadJson = await uploadRes.json();
  assert.equal(uploadJson.status, "success");
  assert.equal(uploadJson.data.storage_key, "media/2026/05/hero.webp");

  const listRes = await app.request(
    "http://localhost/api/admin/media?page=1&limit=12&kategori_penggunaan=galeri",
    {
      method: "GET",
      headers: {
        Cookie: authCookie,
        "x-request-id": "req-media-list-1",
      },
    },
    env,
    executionCtx,
  );
  assert.equal(listRes.status, 200);
  assert.equal(listRes.headers.get("x-request-id"), "req-media-list-1");
  const listJson = await listRes.json();
  assert.equal(listJson.status, "success");
  assert.equal(Array.isArray(listJson.data.items), true);
  assert.equal(listJson.data.items.length, 1);

  const mediaId = listJson.data.items[0].id;

  const patchRes = await app.request(
    `http://localhost/api/admin/media/${mediaId}`,
    {
      method: "PATCH",
      headers: {
        Cookie: authCookie,
        "Content-Type": "application/json",
        "x-request-id": "req-media-patch-1",
      },
      body: JSON.stringify({
        alt_text: "hero update",
        kategori_penggunaan: "artikel",
      }),
    },
    env,
    executionCtx,
  );
  assert.equal(patchRes.status, 200);
  assert.equal(patchRes.headers.get("x-request-id"), "req-media-patch-1");
  const patchJson = await patchRes.json();
  assert.equal(patchJson.data.alt_text, "hero update");
  assert.equal(patchJson.data.kategori_penggunaan, "artikel");

  // Simulasi object baru hilang, object legacy (.thumb.webp) masih ada.
  env._objects.delete("media/2026/05/hero-thumb.webp");
  env._objects.set("media/2026/05/hero.thumb.webp", {
    body: new ReadableStream(),
    httpEtag: "etag-legacy-thumb",
    httpMetadata: {
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  const publicThumbRes = await app.request(
    "http://localhost/api/public/media/2026/05/hero-thumb.webp",
    {
      method: "GET",
      headers: {
        "x-request-id": "req-media-public-legacy-1",
      },
    },
    env,
    executionCtx,
  );
  assert.equal(publicThumbRes.status, 200);
  assert.equal(
    publicThumbRes.headers.get("x-request-id"),
    "req-media-public-legacy-1",
  );

  const deleteRes = await app.request(
    `http://localhost/api/admin/media/${mediaId}`,
    {
      method: "DELETE",
      headers: {
        Cookie: authCookie,
        "x-request-id": "req-media-delete-1",
      },
    },
    env,
    executionCtx,
  );
  assert.equal(deleteRes.status, 200);
  assert.equal(deleteRes.headers.get("x-request-id"), "req-media-delete-1");
  const deleteJson = await deleteRes.json();
  assert.equal(deleteJson.status, "success");
});
