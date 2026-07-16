import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";
import { requireSameOrigin, securityHeaders } from "../server/middleware/security.ts";
import authRouter from "../server/api/admin/auth.ts";
import { readFile } from "node:fs/promises";

const app = new Hono();
app.use("*", securityHeaders);
app.use("/api/admin/*", requireSameOrigin);
app.get("/api/admin/data", (c) => c.json({ ok: true }));
app.post("/api/admin/mutate", (c) => c.json({ ok: true }));

const request = (method, headers = {}) => app.request("https://masjid.example/api/admin/" + (method === "GET" ? "data" : "mutate"), { method, headers });

test("GET admin tidak memerlukan Origin dan menerima security headers", async () => {
  const response = await request("GET");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=/);
});

test("mutasi cookie-auth tanpa Origin ditolak", async () => {
  const response = await request("POST", { cookie: "auth_token=test" });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "FORBIDDEN");
});

test("mutasi cookie-auth cross-origin ditolak", async () => {
  const response = await request("POST", { cookie: "auth_token=test", origin: "https://evil.example" });
  assert.equal(response.status, 403);
});

test("mutasi cookie-auth same-origin diterima", async () => {
  const response = await request("POST", { cookie: "auth_token=test", origin: "https://masjid.example" });
  assert.equal(response.status, 200);
});

test("mutasi admin tanpa cookie tetap memerlukan Origin untuk mencegah login-CSRF", async () => {
  const response = await request("POST");
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "FORBIDDEN");
});

test("endpoint impersonation berada di belakang exact same-origin production middleware", async () => {
  const integrated = new Hono();
  integrated.use("/api/admin/*", requireSameOrigin);
  integrated.route("/api/admin/auth", authRouter);
  const env = { JWT_SECRET: "test", DB: {} };
  for (const action of ["start", "stop"]) {
    const url = `https://masjid.example/api/admin/auth/impersonation/${action}`;
    for (const origin of [undefined, "null", "https://evil.example"]) {
      assert.equal((await integrated.request(url, { method: "POST", headers: origin ? { origin } : {} }, env)).status, 403);
    }
    assert.equal((await integrated.request(url, { method: "POST", headers: { origin: "https://masjid.example" } }, env)).status, 401);
  }
  const source = await readFile("server/index.ts", "utf8");
  assert.ok(source.indexOf('app.use("/api/admin/*", requireSameOrigin)') < source.indexOf('app.route("/api/admin/auth", authRouter)'));
});
