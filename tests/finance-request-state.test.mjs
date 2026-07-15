import test from "node:test";
import assert from "node:assert/strict";
import {
  createIntentKeyStore,
  createLatestRequestGate,
  stableFingerprint,
} from "../src/composables/admin/kas/requestState.ts";

test("request lama tidak boleh commit setelah request terbaru dimulai", () => {
  const gate = createLatestRequestGate();
  const first = gate.begin();
  const second = gate.begin();
  assert.equal(gate.isLatest(first), false);
  assert.equal(gate.isLatest(second), true);
});

test("payload identik setelah failure memakai idempotency key yang sama", () => {
  let generated = 0;
  const keys = createIntentKeyStore(() => `key-${++generated}`);
  const payload = { tipe: "pemasukan", jumlah: 1000, nested: { b: 2, a: 1 } };
  assert.equal(keys.forPayload(payload), keys.forPayload(payload));
  assert.equal(generated, 1);
});

test("perubahan payload merotasi idempotency key", () => {
  let generated = 0;
  const keys = createIntentKeyStore(() => `key-${++generated}`);
  const first = keys.forPayload({ jumlah: 1000 });
  const second = keys.forPayload({ jumlah: 2000 });
  assert.notEqual(first, second);
  assert.equal(generated, 2);
});

test("fingerprint stabil terhadap urutan property dan clear merotasi key", () => {
  assert.equal(stableFingerprint({ b: 2, a: 1 }), stableFingerprint({ a: 1, b: 2 }));
  let generated = 0;
  const keys = createIntentKeyStore(() => `key-${++generated}`);
  const first = keys.forPayload({ a: 1 });
  keys.clear();
  assert.notEqual(keys.forPayload({ a: 1 }), first);
});
