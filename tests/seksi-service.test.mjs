/**
 * Tujuan: Test validasi existence seksi untuk hardening DTO transaksi backend.
 * Caller: npm test
 * Dependensi: node:test, node:assert/strict, server/services/seksi.ts
 * Main Functions: verifikasi existsSeksiById mengembalikan true/false sesuai hasil query.
 * Side Effects: Tidak ada.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { existsSeksiById } from "../server/services/seksi.ts";

test("existsSeksiById: return true saat data seksi ditemukan", async () => {
  const db = {
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return { found: 1 };
            },
          };
        },
      };
    },
  };

  const result = await existsSeksiById(db, 10);
  assert.equal(result, true);
});

test("existsSeksiById: return false saat data seksi tidak ditemukan", async () => {
  const db = {
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return null;
            },
          };
        },
      };
    },
  };

  const result = await existsSeksiById(db, 999);
  assert.equal(result, false);
});
