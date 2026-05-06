/**
 * Tujuan: Unit test kecil untuk helper currency (format & parse) domain kas.
 * Caller: npm test
 * Dependensi: node:test, node:assert/strict, src/utils/currency.ts
 * Main Functions: verifikasi formatRupiah, formatInputRupiah, parseInputRupiah.
 * Side Effects: Tidak ada.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  formatRupiah,
  formatInputRupiah,
  parseInputRupiah,
} from "../src/utils/currency.ts";

test("formatInputRupiah memformat ribuan dan buang non-digit", () => {
  assert.equal(formatInputRupiah("1234567"), "1.234.567");
  assert.equal(formatInputRupiah("12a3b4"), "1.234");
  assert.equal(formatInputRupiah(""), "");
});

test("parseInputRupiah parse aman ke angka", () => {
  assert.equal(parseInputRupiah("1.234.567"), 1234567);
  assert.equal(parseInputRupiah("Rp 250.000"), 250000);
  assert.equal(parseInputRupiah("abc"), 0);
});

test("formatRupiah mengembalikan string IDR", () => {
  const formatted = formatRupiah(1500000);
  assert.match(formatted, /^Rp\s?1\.500\.000$/);
});
