import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import pengaturanRouter from "../server/api/admin/pengaturan.ts";

const secret = "account-route-secret";
const app = new Hono();
app.route("/api/admin/pengaturan", pengaturanRouter);

const cookie = async (role, id = 1, tv = 0) =>
  `auth_token=${await sign({ id, sub: id, role, tv }, secret, "HS256")}`;

const createEnv = ({ targetRole = "pengurus", targetActive = 1, activeSuperadmins = 2 } = {}) => {
  const state = { target: { id: 2, role: targetRole, is_active: targetActive, token_version: 0 }, audits: [] };
  const DB = {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      return { sql: normalized, values: [], bind(...values) { this.values = values; return this; },
        async first() {
          if (normalized.includes("SELECT id, token_version, is_active FROM users")) {
            const id = this.values[0];
            if (id === 1) return { id: 1, token_version: 0, is_active: 1 };
            if (id === 2) return { id: 2, token_version: state.target.token_version, is_active: state.target.is_active };
          }
          if (normalized.includes("SELECT id, COALESCE(operational_role, role) AS role, is_active FROM users")) return this.values[0] === 2 ? state.target : { id: 1, role: "superadmin", is_active: 1 };
          if (normalized.includes("COUNT(*) AS count")) return { count: activeSuperadmins };
          return null;
        },
        async all() { return { results: [state.target] }; },
        async run() { return { success: true, meta: { changes: 1 } }; },
      };
    },
    async batch(items) {
      const update = items[0];
      const guarded = update.sql.includes("EXISTS (") && update.values.at(-2) === 1;
      const changes = guarded && activeSuperadmins <= 1 ? 0 : 1;
      if (changes === 1) {
        if (update.sql.includes("is_active")) state.target.is_active = update.values[0];
        state.target.token_version += 1;
        state.audits.push({ action: items[1].values[2], metadata: items[1].values[3] });
      }
      return items.map(() => ({ success: true, meta: { changes } }));
    },
  };
  return { DB, JWT_SECRET: secret, state };
};

const request = async (env, role, path, method = "GET", body) => app.request(`http://local/api/admin/pengaturan${path}`, {
  method,
  headers: { cookie: await cookie(role), ...(body ? { "content-type": "application/json" } : {}) },
  body: body ? JSON.stringify(body) : undefined,
}, env);

test("ketua ditolak dari seluruh account-management", async () => {
  const env = createEnv();
  for (const [path, method, body] of [
    ["/users", "GET"], ["/users", "POST", { email: "x@example.com", password: "secret12", name: "X", role: "pengurus" }],
    ["/users/2", "PUT", { name: "X", role: "ketua" }], ["/users/2", "DELETE"],
    ["/users/2/password", "PUT", { password: "secret12" }], ["/users/2/active", "PUT", { is_active: true }],
  ]) assert.equal((await request(env, "ketua", path, method, body)).status, 403);
});

test("superadmin dapat disable dan enable; token version dan audit berubah", async () => {
  const env = createEnv();
  assert.equal((await request(env, "superadmin", "/users/2", "DELETE")).status, 200);
  assert.equal(env.state.target.is_active, 0);
  assert.equal(env.state.target.token_version, 1);
  assert.equal(env.state.audits[0].action, "account_disabled");
  assert.equal((await request(env, "superadmin", "/users/2/active", "PUT", { is_active: true })).status, 200);
  assert.equal(env.state.target.is_active, 1);
  assert.equal(env.state.target.token_version, 2);
  assert.equal(env.state.audits[1].action, "account_enabled");
});

test("self-lockout dan last-active-superadmin menghasilkan 409 CONFLICT", async () => {
  const self = await request(createEnv(), "superadmin", "/users/1", "DELETE");
  assert.equal(self.status, 409);
  assert.equal((await self.json()).error.code, "CONFLICT");
  const last = await request(createEnv({ targetRole: "superadmin", activeSuperadmins: 1 }), "superadmin", "/users/2", "DELETE");
  assert.equal(last.status, 409);
  assert.equal((await last.json()).error.code, "CONFLICT");
});
