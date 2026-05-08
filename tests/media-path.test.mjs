/**
 * Tujuan:
 * - Menguji kontrak parser media publik -> storage key R2.
 *
 * Caller:
 * - npm test
 *
 * Dependensi:
 * - node:test
 * - node:assert/strict
 * - server/utils/mediaPath.ts
 *
 * Main Functions:
 * - verifikasi resolveMediaStorageKey untuk canonical path, legacy path, dan path invalid.
 *
 * Side Effects:
 * - Tidak ada.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { resolveMediaStorageKey } from "../server/utils/mediaPath.ts";

test("resolveMediaStorageKey: canonical pathname /api/public/media/<rest>", () => {
  const key = resolveMediaStorageKey({
    pathname:
      "/api/public/media/2026/05/e538b8c6-bc8a-4547-962e-4866ba7fa375-img.webp",
    wildcardPath: "2026/05/e538b8c6-bc8a-4547-962e-4866ba7fa375-img.webp",
  });

  assert.equal(
    key,
    "media/2026/05/e538b8c6-bc8a-4547-962e-4866ba7fa375-img.webp",
  );
});

test("resolveMediaStorageKey: fallback wildcard jika pathname tidak mengandung segment canonical", () => {
  const key = resolveMediaStorageKey({
    pathname: "/media/2026/05/sample.webp",
    wildcardPath: "2026/05/sample.webp",
  });

  assert.equal(key, "media/2026/05/sample.webp");
});

test("resolveMediaStorageKey: backward-compatible untuk legacy media/media/<rest>", () => {
  const key = resolveMediaStorageKey({
    pathname: "/api/public/media/media/2026/05/sample.webp",
    wildcardPath: "media/2026/05/sample.webp",
  });

  assert.equal(key, "media/2026/05/sample.webp");
});

test("resolveMediaStorageKey: return null untuk key kosong", () => {
  const key = resolveMediaStorageKey({
    pathname: "/api/public/media/",
    wildcardPath: "",
  });

  assert.equal(key, null);
});

test("resolveMediaStorageKey: return null untuk traversal path", () => {
  const key = resolveMediaStorageKey({
    pathname: "/api/public/media/../../secret.webp",
    wildcardPath: "../../secret.webp",
  });

  assert.equal(key, null);
});
