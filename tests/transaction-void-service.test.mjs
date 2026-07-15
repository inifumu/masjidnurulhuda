/**
 * Service contract P0.1 untuk pembatalan transaksi tanpa hard-delete.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { voidTransaction } from "../server/services/transaction.ts";

const createDb = ({ status = "approved", changes = 1 } = {}) => {
  const prepared = [];
  const batches = [];
  const db = {
    prepare(sql) {
      const statement = {
        sql: sql.replace(/\s+/g, " ").trim(),
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async first() {
          if (this.sql.includes("SELECT status FROM kas_masjid")) {
            return status ? { status } : null;
          }
          return null;
        },
      };
      prepared.push(statement);
      return statement;
    },
    async batch(statements) {
      batches.push(statements);
      return [
        { success: true, meta: { changes } },
        { success: true, meta: { changes: changes === 1 ? 1 : 0 } },
      ];
    },
  };
  return { db, prepared, batches };
};

test("voidTransaction mempertahankan row dan menulis audit event secara atomic", async () => {
  const { db, batches } = createDb();

  await voidTransaction(db, 42, 7, "Nominal transaksi tercatat ganda");

  assert.equal(batches.length, 1);
  assert.equal(batches[0].length, 2);
  assert.match(batches[0][0].sql, /^UPDATE kas_masjid SET status = 'void'/i);
  assert.doesNotMatch(batches[0][0].sql, /DELETE/i);
  assert.match(batches[0][0].sql, /WHERE id = \? AND status = 'approved'/i);
  assert.deepEqual(batches[0][0].values, [7, "Nominal transaksi tercatat ganda", 42]);
  assert.match(batches[0][1].sql, /INSERT INTO transaction_audit_events/i);
  assert.deepEqual(batches[0][1].values, [
    42,
    "voided",
    "approved",
    "void",
    7,
    "Nominal transaksi tercatat ganda",
  ]);
});

test("voidTransaction menolak transaksi yang bukan approved", async () => {
  const { db, batches } = createDb({ status: "pending_ketua" });

  await assert.rejects(
    () => voidTransaction(db, 42, 7, "Proposal belum boleh dibatalkan sebagai void"),
    /hanya dapat dibatalkan dari status approved/i,
  );
  assert.equal(batches.length, 0);
});

test("voidTransaction menghasilkan conflict saat conditional update tidak berubah", async () => {
  const { db } = createDb({ changes: 0 });

  await assert.rejects(
    () => voidTransaction(db, 42, 7, "Status berubah oleh pengguna lain"),
    /konflik/i,
  );
});
