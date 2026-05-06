/**
 * Tujuan: Test helper validasi DTO transaksi backend.
 * Caller: npm test
 * Dependensi: node:test, node:assert/strict, server/api/admin/transaction.ts
 * Main Functions: verifikasi parsePositiveInt dan parseFiniteAmount untuk payload invalid/valid.
 * Side Effects: Tidak ada.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePositiveInt,
  parseFiniteAmount,
} from "../server/utils/transactionValidation.ts";

test("parsePositiveInt: menerima integer positif valid", () => {
  assert.equal(parsePositiveInt(1), 1);
  assert.equal(parsePositiveInt("7"), 7);
  assert.equal(parsePositiveInt(" 42 "), 42);
});

test("parsePositiveInt: menolak nilai non integer / non positif", () => {
  assert.equal(parsePositiveInt(0), null);
  assert.equal(parsePositiveInt(-1), null);
  assert.equal(parsePositiveInt(3.14), null);
  assert.equal(parsePositiveInt("abc"), null);
  assert.equal(parsePositiveInt(""), null);
  assert.equal(parsePositiveInt(null), null);
  assert.equal(parsePositiveInt(undefined), null);
});

test("parseFiniteAmount: menerima nominal finite positif dalam batas", () => {
  assert.equal(parseFiniteAmount(1), 1);
  assert.equal(parseFiniteAmount("15000"), 15000);
  assert.equal(parseFiniteAmount(" 5000 "), 5000);
  assert.equal(parseFiniteAmount(1_000_000_000_000), 1_000_000_000_000);
});

test("parseFiniteAmount: menolak Infinity/NaN/non-positif/over-limit", () => {
  assert.equal(parseFiniteAmount(Infinity), null);
  assert.equal(parseFiniteAmount(-Infinity), null);
  assert.equal(parseFiniteAmount(NaN), null);
  assert.equal(parseFiniteAmount(0), null);
  assert.equal(parseFiniteAmount(-10), null);
  assert.equal(parseFiniteAmount(""), null);
  assert.equal(parseFiniteAmount("abc"), null);
  assert.equal(parseFiniteAmount(1_000_000_000_001), null);
  assert.equal(parseFiniteAmount("1000000000001"), null);
});
