import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { requireAuth, requireRole } from "../server/middleware/auth.ts";

const secret = "auth-contract-secret";
const app = new Hono();
app.get("/authenticated", requireAuth, (c) => c.json({ ok: true }));
app.get("/restricted", requireAuth, requireRole(["superadmin"]), (c) => c.json({ ok: true }));
app.get("/pengurus-only", requireAuth, requireRole(["pengurus"]), (c) => c.json({ ok: true, user: c.get("jwtPayload") }));
const env = { JWT_SECRET: secret, DB: { prepare: () => ({ bind() { return this; }, first: async () => ({ id: 7, role: "superadmin", token_version: 0, is_active: 1 }) }) } };

test("missing session menghasilkan 401 UNAUTHORIZED", async () => {
  const response = await app.request("http://local/authenticated", {}, env);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "UNAUTHORIZED");
});

test("role yang tidak diizinkan menghasilkan 403 FORBIDDEN", async () => {
  const token = await sign({ id: 7, sub: 7, role: "pengurus", tv: 0, exp: Math.floor(Date.now() / 1000) + 600 }, secret, "HS256");
  const response = await app.request("http://local/restricted", { headers: { cookie: `auth_token=${token}` } }, env);
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "FORBIDDEN");
});

test("role impersonation menjadi otoritas efektif backend tanpa mengubah actor id", async () => {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign({ id: 7, sub: 7, role: "pengurus", original_role: "superadmin", impersonated_by: 7, impersonation_started_at: now, impersonation_expires_at: now + 600, original_exp: now + 1200, tv: 0, exp: now + 600 }, secret, "HS256");
  const headers = { cookie: `auth_token=${token}` };
  assert.equal((await app.request("http://local/restricted", { headers }, env)).status, 403);
  const allowed = await app.request("http://local/pengurus-only", { headers }, env);
  assert.equal(allowed.status, 200);
  const user = (await allowed.json()).user;
  assert.equal(user.role, "pengurus");
  assert.equal(user.sub, 7);
});

test("claim impersonation malformed ditolak fail-closed", async () => {
  const now = Math.floor(Date.now() / 1000);
  const malformed = [
    { id: 7, sub: 7, role: "invalid", tv: 0, exp: now + 600 },
    { id: 7, sub: 7, role: "pengurus", original_role: "superadmin", tv: 0, exp: now + 600 },
    { id: 7, sub: 7, role: "superadmin", original_role: "superadmin", impersonated_by: 7, impersonation_started_at: now, impersonation_expires_at: now + 600, original_exp: now + 1200, tv: 0, exp: now + 600 },
    { id: 7, sub: 7, role: "pengurus", original_role: "superadmin", impersonated_by: 8, impersonation_started_at: now, impersonation_expires_at: now + 600, original_exp: now + 1200, tv: 0, exp: now + 600 },
    { id: 7, sub: 7, role: "pengurus", original_role: "superadmin", impersonated_by: 7, impersonation_started_at: now, impersonation_expires_at: now - 1, original_exp: now + 1200, tv: 0, exp: now + 600 },
    { id: 7, sub: 7, role: "pengurus", original_role: "superadmin", impersonated_by: 7, impersonation_started_at: now, impersonation_expires_at: now + 600, original_exp: now + 300, tv: 0, exp: now + 600 },
  ];
  for (const payload of malformed) {
    const token = await sign(payload, secret, "HS256");
    assert.equal((await app.request("http://local/authenticated", { headers: { cookie: `auth_token=${token}` } }, env)).status, 401);
  }
});
