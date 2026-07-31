import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getCurrentWibPeriod } from "../shared/contracts/index.ts";
import { getWibDate } from "../src/composables/admin/kas/useKasState.ts";

test("tanggal form dan periode kas memakai snapshot bisnis Asia/Jakarta yang sama", () => {
  const utcStillJuly = new Date("2026-07-31T17:30:00.000Z");
  assert.equal(getWibDate(utcStillJuly), "2026-08-01");
  assert.deepEqual(getCurrentWibPeriod(utcStillJuly), { month: 8, year: 2026 });
});

test("reset filter canonical dan ledger parity memakai periode WIB", async () => {
  const [workspace, ledger, state] = await Promise.all([
    readFile(new URL("../src/components/admin/finance/TransactionWorkspace.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/components/admin/finance/TransactionLedger.vue", import.meta.url), "utf8"),
    readFile(new URL("../src/composables/admin/kas/useKasState.ts", import.meta.url), "utf8"),
  ]);
  for (const source of [workspace, ledger]) {
    assert.match(source, /getCurrentWibPeriod/);
    assert.doesNotMatch(source, /new Date\(\)\.getMonth|new Date\(\)\.getFullYear/);
  }
  assert.match(state, /currentYear = initialPeriod\.year/);
});
