/**
 * Kontrak P0.2: conditional transition tetap menjadi arbiter untuk intent bersamaan.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { TransactionConflictError, updateStatus } from "../server/services/transaction.ts";

const createConcurrentDb = (initialStatus = "pending_ketua") => {
  const state = { status: initialStatus, events: [] };
  const db = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      return {
        sql: normalized,
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() {
          if (normalized.includes("SELECT status FROM kas_masjid")) return { status: state.status };
          return null;
        },
      };
    },
    async batch(statements) {
      const update = statements.find((item) => item.sql.startsWith("UPDATE kas_masjid SET status"));
      const audit = statements.find((item) => item.sql.includes("INSERT INTO transaction_audit_events"));
      const nextStatus = update.values[0];
      const expectedStatus = update.values.at(-1);
      const changed = state.status === expectedStatus ? 1 : 0;
      if (changed) {
        state.status = nextStatus;
        state.events.push({ eventType: audit.values[1], toStatus: audit.values[3] });
      }
      return statements.map((item) => ({
        meta: { changes: item === update || item === audit ? changed : 1 },
      }));
    },
  };
  return { db, state };
};

test("approve/approve bersamaan hanya menghasilkan satu transition dan satu audit event", async () => {
  const { db, state } = createConcurrentDb();
  const results = await Promise.allSettled([
    updateStatus(db, 42, "pending_bendahara", 7),
    updateStatus(db, 42, "pending_bendahara", 8),
  ]);

  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected" && result.reason instanceof TransactionConflictError).length, 1);
  assert.equal(state.status, "pending_bendahara");
  assert.deepEqual(state.events, [{ eventType: "approved_ketua", toStatus: "pending_bendahara" }]);
});

test("approve/reject bersamaan hanya memilih satu final state dan satu audit event", async () => {
  const { db, state } = createConcurrentDb();
  const results = await Promise.allSettled([
    updateStatus(db, 42, "pending_bendahara", 7),
    updateStatus(db, 42, "rejected", 8, "Proposal tidak sesuai kebutuhan masjid"),
  ]);

  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected" && result.reason instanceof TransactionConflictError).length, 1);
  assert.ok(["pending_bendahara", "rejected"].includes(state.status));
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].toStatus, state.status);
});

test("approval idempotent membatch claim, conditional update, audit, lalu finalize", async () => {
  const batches = [];
  const db = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      return {
        sql: normalized,
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() { return normalized.includes("SELECT status") ? { status: "pending_ketua" } : null; },
      };
    },
    async batch(statements) {
      batches.push(statements);
      return statements.map(() => ({ meta: { changes: 1 } }));
    },
  };

  await updateStatus(db, 42, "pending_bendahara", 7, null, undefined, {
    key: "approve-key-123456789",
    operation: "approve_ketua",
    requestHash: "hash",
  });

  assert.equal(batches[0].length, 4);
  assert.match(batches[0][0].sql, /INSERT INTO transaction_idempotency_keys/i);
  assert.match(batches[0][1].sql, /UPDATE kas_masjid/i);
  assert.match(batches[0][2].sql, /INSERT INTO transaction_audit_events/i);
  assert.match(batches[0][3].sql, /state = 'completed'/i);
});
