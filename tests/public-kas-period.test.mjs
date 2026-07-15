import test from "node:test";
import assert from "node:assert/strict";
import { getWibMonthBounds } from "../server/api/public/kas.ts";

test("boundary bulan publik mengikuti Asia/Jakarta saat UTC masih bulan sebelumnya", () => {
  assert.deepEqual(
    getWibMonthBounds(new Date("2026-06-30T17:30:00.000Z")),
    { periodStart: "2026-07-01", nextPeriodStart: "2026-08-01" },
  );
});

test("boundary Desember WIB bergulir ke Januari tahun berikutnya", () => {
  assert.deepEqual(
    getWibMonthBounds(new Date("2026-12-31T17:00:00.000Z")),
    { periodStart: "2027-01-01", nextPeriodStart: "2027-02-01" },
  );
});
