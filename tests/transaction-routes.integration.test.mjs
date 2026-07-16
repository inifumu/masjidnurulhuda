import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import transactionRouter from "../server/api/admin/transaction.ts";

const JWT_SECRET = "test-secret-transaction-routes";
const app = new Hono();
app.route("/api/admin/transaction", transactionRouter);

const cookie = async (role, id = 7) => `auth_token=${await sign({ id, sub: id, role, tv: 0, exp: Math.floor(Date.now() / 1000) + 600 }, JWT_SECRET, "HS256")}`;

const createEnv = ({ status = "approved", updateChanges = 1 } = {}) => {
  const state = { transaction: { id: 42, status }, events: [] };
  const DB = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      const statement = { sql: normalized, values: [], bind(...values) { this.values = values; return this; }, async first() {
        if (normalized.includes("COALESCE(operational_role, role) AS role")) return { id: 7, role: "superadmin", token_version: 0, is_active: 1 };
        if (normalized.includes("SELECT status FROM kas_masjid")) return state.transaction ? { status: state.transaction.status } : null;
        if (normalized.includes("FROM transaction_idempotency_keys")) return null;
        return null;
      }};
      return statement;
    },
    async batch(statements) {
      if (updateChanges === 1) {
        state.transaction.status = "void";
        state.events.push({ transaction_id: 42, event_type: "voided", actor_id: 7, reason: statements[0].values[1] });
      }
      return statements.map(() => ({ meta: { changes: updateChanges } }));
    },
  };
  return { DB, JWT_SECRET, state };
};

const request = async (env, role, method = "POST", body = { reason: "Nominal transaksi tercatat ganda" }) => app.request(
  "http://local/api/admin/transaction/42" + (method === "POST" ? "/void" : ""),
  { method, headers: { cookie: await cookie(role), "content-type": "application/json", "Idempotency-Key": "route-void-key-123456" }, body: method === "POST" ? JSON.stringify(body) : undefined }, env,
);

for (const role of ["bendahara", "superadmin"]) test(`${role} berhasil void dan menyimpan row+event`, async () => {
  const env = createEnv();
  const response = await request(env, role);
  assert.equal(response.status, 200);
  assert.equal(env.state.transaction.status, "void");
  assert.equal(env.state.events[0].event_type, "voided");
});
for (const role of ["ketua", "pengurus"]) test(`${role} mendapat 403 saat void`, async () => {
  const response = await request(createEnv(), role);
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "FORBIDDEN");
});
test("alasan void invalid mendapat 400", async () => assert.equal((await request(createEnv(), "bendahara", "POST", { reason: "pendek" })).status, 400));
test("duplicate void mendapat exact state conflict", async () => {
  const response = await request(createEnv({ status: "void" }), "bendahara");
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, "TRANSACTION_STATE_CHANGED");
});
test("stale conditional void mendapat exact state conflict", async () => {
  const response = await request(createEnv({ updateChanges: 0 }), "bendahara");
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, "TRANSACTION_STATE_CHANGED");
});
test("DELETE transaksi mendapat 405", async () => assert.equal((await request(createEnv(), "bendahara", "DELETE")).status, 405));
