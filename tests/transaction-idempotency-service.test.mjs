/**
 * Kontrak P0.2 untuk validasi key, canonical hash, replay, dan payload conflict.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalRequestHash,
  parseIdempotencyKey,
  resolveClaimFailure,
  resolveIdempotencyReplay,
} from "../server/services/transactionIdempotency.ts";

test("idempotency key menerima token 16-128 karakter", () => {
  assert.equal(parseIdempotencyKey("qa-key-1234567890"), "qa-key-1234567890");
  assert.equal(parseIdempotencyKey("pendek"), null);
  assert.equal(parseIdempotencyKey("x".repeat(129)), null);
  assert.equal(parseIdempotencyKey("invalid key spaces"), null);
});

test("canonical hash stabil terhadap urutan property", async () => {
  const a = await canonicalRequestHash({ jumlah: 1000, tipe: "pemasukan" });
  const b = await canonicalRequestHash({ tipe: "pemasukan", jumlah: 1000 });
  assert.equal(a, b);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test("replay mengembalikan response lama untuk hash yang sama", () => {
  const stored = { request_hash: "abc", response_status: 201, response_body: '{"id":7}' };
  assert.deepEqual(resolveIdempotencyReplay(stored, "abc"), {
    replayed: true,
    status: 201,
    body: { id: 7 },
  });
});

test("key sama dengan payload berbeda menghasilkan conflict", () => {
  assert.throws(
    () => resolveIdempotencyReplay({ request_hash: "abc", response_status: 201, response_body: "{}" }, "different"),
    /payload berbeda/i,
  );
});

const claimDb = (stored) => ({
  prepare() {
    return {
      bind() { return this; },
      async first() { return stored; },
    };
  },
});

test("claim loser me-replay response completed dengan hash sama", async () => {
  const replay = await resolveClaimFailure(claimDb({
    request_hash: "abc",
    response_status: 201,
    response_body: '{"transaction_id":7}',
  }), 7, {
    key: "claim-key-123456789",
    operation: "create_direct",
    requestHash: "abc",
  });
  assert.equal(replay.status, 201);
  assert.deepEqual(replay.body, { transaction_id: 7 });
});

test("claim loser processing menghasilkan 409 domain deterministik", async () => {
  await assert.rejects(() => resolveClaimFailure(claimDb({
    request_hash: "abc",
    response_status: null,
    response_body: null,
  }), 7, {
    key: "claim-key-123456789",
    operation: "create_direct",
    requestHash: "abc",
  }), /masih diproses/i);
});

test("claim loser tanpa record menghasilkan conflict, bukan error storage mentah", async () => {
  await assert.rejects(() => resolveClaimFailure(claimDb(null), 7, {
    key: "claim-key-123456789",
    operation: "create_direct",
    requestHash: "abc",
  }), /gagal diklaim/i);
});
