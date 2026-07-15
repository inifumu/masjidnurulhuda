import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_ROLES, TRANSACTION_TYPES, TRANSACTION_STATUSES, APPROVAL_ACTIONS, CATEGORY_FLOWS, isAdminRole, parseBusinessPeriod } from "../shared/contracts/index.ts";

test("shared literals menjadi sumber enum operasional", () => {
  assert.deepEqual(ADMIN_ROLES, ["superadmin", "ketua", "bendahara", "pengurus"]);
  assert.deepEqual(TRANSACTION_TYPES, ["pemasukan", "pengeluaran"]);
  assert.deepEqual(TRANSACTION_STATUSES, ["pending_ketua", "pending_bendahara", "approved", "rejected", "void"]);
  assert.deepEqual(APPROVAL_ACTIONS, ["approve", "reject"]);
  assert.deepEqual(CATEGORY_FLOWS, ["pemasukan", "pengeluaran", "general"]);
  assert.equal(isAdminRole("bendahara"), true);
  assert.equal(isAdminRole("owner"), false);
});

test("business period tervalidasi sebagai discriminated result", () => {
  assert.deepEqual(parseBusinessPeriod("7", "2026"), { ok: true, value: { month: 7, year: 2026 } });
  assert.deepEqual(parseBusinessPeriod("13", "2026"), { ok: false, fields: { month: "Bulan harus antara 1 dan 12." } });
  assert.deepEqual(parseBusinessPeriod("7", undefined), { ok: false, fields: { year: "Bulan dan tahun harus dikirim bersamaan." } });
});
