import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import authRouter from "../server/api/admin/auth.ts";
import { hashPassword } from "../server/utils/crypto.ts";

const JWT_SECRET = "auth-route-integration-secret";
const app = new Hono();
app.route("/api/admin/auth", authRouter);

const createEnv = async ({ active = 1, tokenVersion = 0 } = {}) => {
  const user = {
    id: 7,
    email: "admin@example.com",
    password_hash: await hashPassword("password-benar"),
    name: "Admin",
    role: "superadmin",
    token_version: tokenVersion,
    is_active: active,
  };
  const state = { user, limiter: new Map(), audits: [], passwordQueries: 0 };
  const DB = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      return {
        sql: normalized,
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() {
          if (normalized.startsWith("SELECT blocked_until FROM login_rate_limits")) {
            const row = state.limiter.get(this.values[0]);
            return row ? { blocked_until: row.blockedUntil } : null;
          }
          if (normalized.includes("INSERT INTO login_rate_limits")) {
            const key = this.values[0];
            const current = state.limiter.get(key)?.count ?? 0;
            const count = current + 1;
            state.limiter.set(key, { count, blockedUntil: count > 5 ? Date.now() + 900_000 : null });
            return {
              failure_count: count,
              blocked_until: count > 5 ? Date.now() + 900_000 : null,
            };
          }
          if (normalized.includes("COALESCE(operational_role, role) AS role") && normalized.includes("FROM users WHERE email = ?")) {
            state.passwordQueries += 1;
            return this.values[0] === user.email ? user : null;
          }
          if (normalized.includes("SELECT id, token_version, is_active FROM users")) {
            return this.values[0] === user.id
              ? { id: user.id, token_version: user.token_version, is_active: user.is_active }
              : null;
          }
          return null;
        },
        async run() {
          if (normalized.startsWith("DELETE FROM login_rate_limits")) {
            const existed = state.limiter.delete(this.values[0]);
            return { success: true, meta: { changes: existed ? 1 : 0 } };
          }
          if (normalized.includes("INSERT INTO security_audit_events")) {
            state.audits.push({ target_user_id: this.values[0], action: this.values[1], metadata: this.values[2] });
          }
          if (normalized.includes("UPDATE users SET token_version")) user.token_version += 1;
          return { success: true, meta: { changes: 1 } };
        },
      };
    },
  };
  return { DB, JWT_SECRET, state };
};

const login = (env, password = "password-benar") => app.request(
  "https://masjid.example/api/admin/auth/login",
  {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.10" },
    body: JSON.stringify({ email: "admin@example.com", password }),
  },
  env,
);

test("login valid menghasilkan cookie dan audit sukses tanpa data sensitif", async () => {
  const env = await createEnv();
  const response = await login(env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") ?? "", /auth_token=.*HttpOnly.*Secure.*SameSite=Lax/i);
  assert.deepEqual(env.state.audits, [{ target_user_id: 7, action: "login_succeeded", metadata: "{}" }]);
  assert.doesNotMatch(JSON.stringify(env.state.audits), /admin@example|password-benar|203\.0\.113/);
});

test("login sukses berulang tidak mengonsumsi quota", async () => {
  const env = await createEnv();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    assert.equal((await login(env)).status, 200);
  }
  assert.equal(env.state.limiter.size, 0);
});

test("login sukses membersihkan bucket setelah failure", async () => {
  const env = await createEnv();
  assert.equal((await login(env, "password-salah")).status, 401);
  assert.equal(env.state.limiter.size, 1);
  assert.equal((await login(env)).status, 200);
  assert.equal(env.state.limiter.size, 0);
});

test("login invalid menghasilkan 401 dan audit gagal", async () => {
  const env = await createEnv();
  const response = await login(env, "password-salah");
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "UNAUTHORIZED");
  assert.equal(env.state.audits[0].action, "login_failed");
});

test("request keenam menghasilkan 429 RATE_LIMITED dan Retry-After", async () => {
  const env = await createEnv();
  for (let attempt = 0; attempt < 5; attempt += 1) assert.equal((await login(env, "password-salah")).status, 401);
  const response = await login(env, "password-salah");
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error.code, "RATE_LIMITED");
  assert.ok(Number(response.headers.get("retry-after")) > 0);
  assert.equal(env.state.audits.at(-1).action, "login_rate_limited");
});

test("request yang sudah blocked tidak melakukan verifikasi password", async () => {
  const env = await createEnv();
  for (let attempt = 0; attempt < 6; attempt += 1) await login(env, "password-salah");
  const queriesBefore = env.state.passwordQueries;
  assert.equal((await login(env)).status, 429);
  assert.equal(env.state.passwordQueries, queriesBefore);
});

test("akun disabled tidak dapat login dan sesi token-version lama ditolak", async () => {
  const disabled = await createEnv({ active: 0 });
  assert.equal((await login(disabled)).status, 401);

  const active = await createEnv({ tokenVersion: 2 });
  const validLogin = await login(active);
  const cookie = validLogin.headers.get("set-cookie")?.split(";")[0];
  active.state.user.token_version += 1;
  const me = await app.request("https://masjid.example/api/admin/auth/me", { headers: { cookie } }, active);
  assert.equal(me.status, 401);
  assert.equal((await me.json()).error.code, "UNAUTHORIZED");
});
