/**
 * Tujuan: Test matrix RBAC helper permission UI admin.
 * Caller: npm test
 * Dependensi: node:test, node:assert/strict, src/utils/permissions.ts
 * Main Functions: verifikasi canDelete/canApprove/canAccessKasInput/canViewProposalTab.
 * Side Effects: Tidak ada.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  canDelete,
  canApprove,
  canAccessKasInput,
  canViewProposalTab,
} from "../src/utils/permissions.ts";

test("matrix canDelete: superadmin/ketua/bendahara boleh, pengurus tidak", () => {
  assert.equal(canDelete("superadmin"), true);
  assert.equal(canDelete("ketua"), true);
  assert.equal(canDelete("bendahara"), true);
  assert.equal(canDelete("pengurus"), false);
  assert.equal(canDelete("unknown"), false);
  assert.equal(canDelete(undefined), false);
});

test("matrix canApprove: superadmin/ketua/bendahara boleh, pengurus tidak", () => {
  assert.equal(canApprove("superadmin"), true);
  assert.equal(canApprove("ketua"), true);
  assert.equal(canApprove("bendahara"), true);
  assert.equal(canApprove("pengurus"), false);
});

test("matrix canAccessKasInput: role approver boleh, pengurus tidak", () => {
  assert.equal(canAccessKasInput("superadmin"), true);
  assert.equal(canAccessKasInput("ketua"), true);
  assert.equal(canAccessKasInput("bendahara"), true);
  assert.equal(canAccessKasInput("pengurus"), false);
});

test("matrix canViewProposalTab: semua role operasional boleh", () => {
  assert.equal(canViewProposalTab("superadmin"), true);
  assert.equal(canViewProposalTab("ketua"), true);
  assert.equal(canViewProposalTab("bendahara"), true);
  assert.equal(canViewProposalTab("pengurus"), true);
  assert.equal(canViewProposalTab("unknown"), false);
});
