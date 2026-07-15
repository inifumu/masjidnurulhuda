import test from "node:test";
import assert from "node:assert/strict";
import { buildApiError, parseApiErrorBody } from "../shared/contracts/index.ts";

test("machine-readable error membawa code dan field map", () => {
  const body = buildApiError("VALIDATION_ERROR", "Periksa input.", { jumlah: "Nominal tidak valid." });
  assert.deepEqual(body, { status: "error", message: "Periksa input.", error: { code: "VALIDATION_ERROR", fields: { jumlah: "Nominal tidak valid." } } });
  assert.deepEqual(parseApiErrorBody(body), body);
});

test("parser error menormalkan legacy dan malformed body", () => {
  assert.equal(parseApiErrorBody({ status: "error", message: "Legacy" }).message, "Legacy");
  assert.equal(parseApiErrorBody(null).error.code, "INTERNAL_ERROR");
});
