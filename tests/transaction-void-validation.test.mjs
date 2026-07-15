/** Kontrak validasi alasan void pada boundary API. */
import test from "node:test";
import assert from "node:assert/strict";
import { parseVoidReason } from "../server/utils/transactionValidation.ts";

test("parseVoidReason menerima alasan trimmed sepanjang 10-500 karakter", () => {
  assert.equal(
    parseVoidReason("  Nominal transaksi tercatat ganda  "),
    "Nominal transaksi tercatat ganda",
  );
  assert.equal(parseVoidReason("a".repeat(500)), "a".repeat(500));
});

test("parseVoidReason menolak non-string, terlalu pendek, dan terlalu panjang", () => {
  assert.equal(parseVoidReason(null), null);
  assert.equal(parseVoidReason("terlalu"), null);
  assert.equal(parseVoidReason("a".repeat(501)), null);
});
