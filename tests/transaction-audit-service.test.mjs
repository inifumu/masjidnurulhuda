/**
 * Kontrak P0.1: seluruh mutasi status menulis audit event dalam batch atomic.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  assertFinancialFieldsMutable,
  createTransaction,
  getTransactionAuditTimeline,
  updateStatus,
} from "../server/services/transaction.ts";

const statement = (sql, firstResult = null) => ({
  sql: sql.replace(/\s+/g, " ").trim(),
  values: [],
  bind(...values) { this.values = values; return this; },
  async first() { return firstResult; },
  async all() { return { results: [] }; },
});

test("createTransaction membuat row dan event created secara atomic", async () => {
  const batches = [];
  const db = {
    prepare(sql) { return statement(sql); },
    async batch(items) {
      batches.push(items);
      return [{ meta: { changes: 1, last_row_id: 12 } }, { meta: { changes: 1 } }];
    },
  };

  await createTransaction(db, {
    tipe: "pemasukan", jumlah: 100000, keterangan: "Infak Jumat",
    tanggal: "2026-07-10", kategori_id: 1, status: "approved",
  }, 7);

  assert.equal(batches[0].length, 2);
  assert.match(batches[0][0].sql, /INSERT INTO kas_masjid/i);
  assert.match(batches[0][1].sql, /INSERT INTO transaction_audit_events/i);
  assert.deepEqual(batches[0][1].values, ["created", "approved", 7]);
});

test("createTransaction menyimpan hasil idempotency dalam batch yang sama", async () => {
  const batches = [];
  const db = {
    prepare(sql) { return statement(sql); },
    async batch(items) {
      batches.push(items);
      return [
        { meta: { changes: 1 } },
        { meta: { changes: 1, last_row_id: 21 } },
        { meta: { changes: 1 } },
        { meta: { changes: 1 } },
      ];
    },
  };

  const result = await createTransaction(db, {
    tipe: "pemasukan", jumlah: 1000, keterangan: "Idempotent",
    tanggal: "2026-07-12", kategori_id: 1, status: "approved",
  }, 7, { key: "qa-key-1234567890", operation: "create_direct", requestHash: "hash" });

  assert.equal(batches[0].length, 4);
  assert.match(batches[0][0].sql, /INSERT INTO transaction_idempotency_keys/i);
  assert.deepEqual(batches[0][0].values.slice(0, 4), [7, "create_direct", "qa-key-1234567890", "hash"]);
  assert.match(batches[0][1].sql, /INSERT INTO kas_masjid/i);
  assert.match(batches[0][2].sql, /INSERT INTO transaction_audit_events/i);
  assert.equal(batches[0][1].values[0], batches[0][2].values[0]);
  assert.match(batches[0][3].sql, /state = 'completed'/i);
  assert.equal(result.meta.last_row_id, 21);
});

test("createTransaction proposal menulis event submitted", async () => {
  const batches = [];
  const db = {
    prepare(sql) { return statement(sql); },
    async batch(items) {
      batches.push(items);
      return [{ meta: { changes: 1, last_row_id: 13 } }, { meta: { changes: 1 } }];
    },
  };

  await createTransaction(db, {
    tipe: "pengeluaran", jumlah: 50000, keterangan: "Konsumsi rapat",
    tanggal: "2026-07-10", kategori_id: 2, seksi_id: 1,
    status: "pending_ketua",
  }, 8);

  assert.deepEqual(batches[0][1].values, ["submitted", "pending_ketua", 8]);
});

test("updateStatus approval ketua menulis event dalam batch atomic", async () => {
  const batches = [];
  const db = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      return statement(sql, normalized.includes("SELECT status") ? { status: "pending_ketua" } : null);
    },
    async batch(items) {
      batches.push(items);
      return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }];
    },
  };

  await updateStatus(db, 4, "pending_bendahara", 9);
  assert.equal(batches[0].length, 2);
  assert.deepEqual(batches[0][1].values, [4, "approved_ketua", "pending_ketua", "pending_bendahara", 9, null]);
});

test("updateStatus reject mewajibkan alasan dan mencatatnya", async () => {
  const db = {
    prepare(sql) { return statement(sql, { status: "pending_bendahara" }); },
    async batch() { throw new Error("tidak boleh dipanggil"); },
  };
  await assert.rejects(() => updateStatus(db, 4, "rejected", 9), /alasan/i);
});

test("field finansial immutable setelah approved atau void", () => {
  assert.doesNotThrow(() => assertFinancialFieldsMutable("pending_ketua"));
  assert.throws(() => assertFinancialFieldsMutable("approved"), /tidak dapat diubah/i);
  assert.throws(() => assertFinancialFieldsMutable("void"), /tidak dapat diubah/i);
});

test("timeline mengembalikan penanda legacy jika tidak ada event", async () => {
  const db = {
    lastTimelineSql: "",
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      if (normalized.includes("FROM kas_masjid")) return statement(sql, { id: 5 });
      this.lastTimelineSql = normalized;
      return statement(sql);
    },
  };
  const result = await getTransactionAuditTimeline(db, 5);
  assert.deepEqual(result, { events: [], history_available: false });
  assert.match(db.lastTimelineSql, /u\.name as actor_name/i);
});
