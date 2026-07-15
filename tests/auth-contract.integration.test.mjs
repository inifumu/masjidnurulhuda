import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { requireAuth, requireRole } from "../server/middleware/auth.ts";

const secret = "auth-contract-secret";
const app = new Hono();
app.get("/authenticated", requireAuth, (c) => c.json({ ok: true }));
app.get("/restricted", requireAuth, requireRole(["superadmin"]), (c) => c.json({ ok: true }));
const env = { JWT_SECRET: secret, DB: { prepare: () => ({ bind() { return this; }, first: async () => ({ id: 7, token_version: 0 }) }) } };

test("missing session menghasilkan 401 UNAUTHORIZED", async () => {
  const response = await app.request("http://local/authenticated", {}, env);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "UNAUTHORIZED");
});

test("role yang tidak diizinkan menghasilkan 403 FORBIDDEN", async () => {
  const token = await sign({ id: 7, sub: 7, role: "pengurus", tv: 0 }, secret, "HS256");
  const response = await app.request("http://local/restricted", { headers: { cookie: `auth_token=${token}` } }, env);
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "FORBIDDEN");
});
