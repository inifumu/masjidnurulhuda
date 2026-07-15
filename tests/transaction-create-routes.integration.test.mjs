/**
 * Route integration P0.2 untuk duplicate/replay dan payload conflict create.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import transactionRouter from "../server/api/admin/transaction.ts";

const JWT_SECRET = "test-secret-create-routes";
const app = new Hono();
app.route("/api/admin/transaction", transactionRouter);
const cookie = async () => `auth_token=${await sign({ id: 7, sub: 7, role: "pengurus", tv: 0 }, JWT_SECRET, "HS256")}`;
const roleCookie = async (role) => `auth_token=${await sign({ id: 7, sub: 7, role, tv: 0 }, JWT_SECRET, "HS256")}`;

const createEnv = () => {
  const state = { transactions: [], events: [], registry: new Map() };
  const DB = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      return {
        sql: normalized,
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() {
          if (normalized.includes("SELECT id, token_version, is_active FROM users")) return { id: 7, token_version: 0, is_active: 1 };
          if (normalized.includes("SELECT 1 as found FROM seksi_pengurus")) return { found: 1 };
          if (normalized.includes("FROM transaction_idempotency_keys")) {
            const [actor, operation, key] = this.values;
            return state.registry.get(`${actor}:${operation}:${key}`) ?? null;
          }
          return null;
        },
      };
    },
    async batch(statements) {
      const claim = statements[0];
      const [actor, operation, key, hash] = claim.values;
      const registryKey = `${actor}:${operation}:${key}`;
      if (state.registry.has(registryKey)) throw new Error("UNIQUE constraint failed: transaction_idempotency_keys");
      const inserted = statements[1];
      const transactionId = inserted.values[0];
      state.transactions.push({ id: transactionId, values: inserted.values });
      state.events.push({ transaction_id: statements[2].values[0] });
      const body = JSON.parse(statements[3].values[1]);
      state.registry.set(registryKey, {
        request_hash: hash,
        response_status: 201,
        response_body: JSON.stringify(body),
        transaction_id: transactionId,
      });
      return statements.map(() => ({ meta: { changes: 1 } }));
    },
  };
  return { DB, JWT_SECRET, state };
};

const directPayload = { tipe: "pemasukan", jumlah: 100000, keterangan: "Infak Jumat", tanggal: "2026-07-13", kategori_id: 1, metode: "kas_langsung" };
const proposalPayload = { tipe: "pengeluaran", jumlah: 250000, keterangan: "Konsumsi rapat pengurus", tanggal: "2026-07-13", kategori_id: 2, seksi_id: 1, metode: "reimbursement" };

const post = async (env, path, key, payload, role = "pengurus") => app.request(`http://local/api/admin/transaction/${path}`, {
  method: "POST",
  headers: { cookie: role === "pengurus" ? await cookie() : await roleCookie(role), "content-type": "application/json", "Idempotency-Key": key },
  body: JSON.stringify(payload),
}, env);

for (const scenario of [
  { name: "direct", path: "add-direct", key: "direct-route-key-123456", payload: directPayload, role: "bendahara" },
  { name: "proposal", path: "add-proposal", key: "proposal-route-key-1234", payload: proposalPayload, role: "pengurus" },
]) {
  test(`duplicate ${scenario.name} mereplay dan hanya menyimpan satu transaksi/event`, async () => {
    const env = createEnv();
    const first = await post(env, scenario.path, scenario.key, scenario.payload, scenario.role);
    const duplicate = await post(env, scenario.path, scenario.key, scenario.payload, scenario.role);
    assert.equal(first.status, 201);
    assert.equal(duplicate.status, 201);
    assert.equal(env.state.transactions.length, 1);
    assert.equal(env.state.events.length, 1);
    assert.equal(env.state.registry.size, 1);
  });

  test(`${scenario.name} key sama dengan payload berbeda mendapat 409`, async () => {
    const env = createEnv();
    await post(env, scenario.path, scenario.key, scenario.payload, scenario.role);
    const conflict = await post(env, scenario.path, scenario.key, { ...scenario.payload, jumlah: scenario.payload.jumlah + 1 }, scenario.role);
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).error.code, "IDEMPOTENCY_CONFLICT");
    assert.equal(env.state.transactions.length, 1);
    assert.equal(env.state.events.length, 1);
  });

  test(`${scenario.name} tanpa Idempotency-Key mendapat contract exact`, async () => {
    const response = await post(createEnv(), scenario.path, "", scenario.payload, scenario.role);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "IDEMPOTENCY_REQUIRED");
  });
}

test("direct validation mengembalikan status, code, dan fields exact", async () => {
  const response = await post(createEnv(), "add-direct", "direct-invalid-123456", { ...directPayload, jumlah: 0, keterangan: "" }, "bendahara");
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.ok(body.error.fields.jumlah);
  assert.ok(body.error.fields.keterangan);
});

test("pengurus tidak dapat mencatat transaksi direct melalui backend", async () => {
  const response = await app.request("http://local/api/admin/transaction/add-direct", {
    method: "POST",
    headers: { cookie: await roleCookie("pengurus"), "content-type": "application/json", "Idempotency-Key": "direct-rbac-key-123456" },
    body: JSON.stringify(directPayload),
  }, createEnv());
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "FORBIDDEN");
});
