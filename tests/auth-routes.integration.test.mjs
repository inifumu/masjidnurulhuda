import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
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
          if (normalized.includes("COALESCE(operational_role, role) AS role") && normalized.includes("FROM users WHERE id = ?")) {
            return this.values[0] === user.id
              ? { id: user.id, role: user.role, token_version: user.token_version, is_active: user.is_active }
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
            state.audits.push(normalized.includes("actor_id")
              ? { actor_id: this.values[0], target_user_id: this.values[1], action: this.values[2], metadata: this.values[3] }
              : { target_user_id: this.values[0], action: this.values[1], metadata: this.values[2] });
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

const sessionCookie = async (role = "superadmin", extra = {}) => {
  const token = await sign({ sub: 7, id: 7, name: "Admin", role, tv: 0, exp: Math.floor(Date.now() / 1000) + 3600, ...extra }, JWT_SECRET, "HS256");
  return `auth_token=${token}`;
};

const impersonationRequest = (env, path, cookie, body) => app.request(
  `https://masjid.example/api/admin/auth/impersonation/${path}`,
  { method: "POST", headers: { cookie, "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) }, env,
);

test("hanya superadmin asli dapat memulai role impersonation", async () => {
  const env = await createEnv();
  assert.equal((await impersonationRequest(env, "start", await sessionCookie("ketua"), { role: "pengurus" })).status, 403);
});

test("start impersonation memverifikasi role superadmin terkini langsung dari database", async () => {
  const env = await createEnv();
  env.state.user.role = "ketua";
  assert.equal((await impersonationRequest(env, "start", await sessionCookie(), { role: "pengurus" })).status, 403);
});

test("superadmin memulai impersonation dengan role efektif, identitas asli, expiry, dan audit", async () => {
  const env = await createEnv();
  const response = await impersonationRequest(env, "start", await sessionCookie(), { role: "pengurus" });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  const payload = await verify(cookie.replace("auth_token=", ""), JWT_SECRET, "HS256");
  assert.equal(payload.role, "pengurus");
  assert.equal(payload.original_role, "superadmin");
  assert.equal(payload.impersonated_by, 7);
  assert.equal(payload.original_exp, Math.floor(Date.now() / 1000) + 3600);
  assert.ok(Number(payload.impersonation_expires_at) > Math.floor(Date.now() / 1000));
  assert.deepEqual(env.state.audits.at(-1), {
    actor_id: 7, target_user_id: 7, action: "role_impersonation_started", metadata: JSON.stringify({ role: "pengurus" }),
  });

  const me = await app.request("https://masjid.example/api/admin/auth/me", { headers: { cookie } }, env);
  const data = (await me.json()).data;
  assert.equal(data.role, "pengurus");
  assert.deepEqual(data.impersonation, { active: true, role: "pengurus", original_role: "superadmin", actor_id: 7, actor_name: "Admin", expires_at: payload.impersonation_expires_at });
});

test("impersonation menolak target superadmin dan samaran berantai", async () => {
  const env = await createEnv();
  const now = Math.floor(Date.now() / 1000);
  assert.equal((await impersonationRequest(env, "start", await sessionCookie(), { role: "superadmin" })).status, 400);
  const nestedCookie = await sessionCookie("pengurus", { original_role: "superadmin", impersonated_by: 7, impersonation_started_at: now, impersonation_expires_at: now + 600, original_exp: now + 1800, exp: now + 600 });
  assert.equal((await impersonationRequest(env, "start", nestedCookie, { role: "ketua" })).status, 403);
});

test("stop impersonation memulihkan superadmin dan mencatat audit", async () => {
  const env = await createEnv();
  const now = Math.floor(Date.now() / 1000);
  const originalExp = now + 1800;
  const cookie = await sessionCookie("bendahara", { original_role: "superadmin", impersonated_by: 7, impersonation_started_at: now, impersonation_expires_at: now + 600, original_exp: originalExp, exp: now + 600 });
  const response = await impersonationRequest(env, "stop", cookie);
  assert.equal(response.status, 200);
  const restored = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  const payload = await verify(restored.replace("auth_token=", ""), JWT_SECRET, "HS256");
  assert.equal(payload.role, "superadmin");
  assert.equal(payload.exp, originalExp);
  assert.equal(payload.impersonated_by, undefined);
  assert.equal(env.state.audits.at(-1).action, "role_impersonation_stopped");
});
