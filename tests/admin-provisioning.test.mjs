import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  assertStrongProvisioningPassword,
  buildProvisioningSql,
  normalizeProvisioningInput,
} from "../scripts/provision-admin.mjs";

const strong = "Tumbuh!Aman-2026#Lokal";

test("provisioning menolak password default dan lemah", () => {
  for (const password of ["admin123", "password", "Pendek1!", "semuahurufpanjang"]) {
    assert.throws(() => assertStrongProvisioningPassword(password), /password/i);
  }
  assert.doesNotThrow(() => assertStrongProvisioningPassword(strong));
});

test("input provisioning menormalisasi email dan mewajibkan identitas", () => {
  assert.deepEqual(normalizeProvisioningInput({ email: " ADMIN@Example.COM ", name: " Admin Recovery ", password: strong }), {
    email: "admin@example.com", name: "Admin Recovery", password: strong,
  });
  assert.throws(() => normalizeProvisioningInput({ email: "x", name: "", password: strong }), /nama/i);
});

test("SQL default idempotent tidak overwrite akun existing", () => {
  const sql = buildProvisioningSql({ email: "admin@example.com", name: "Admin Recovery", passwordHash: "a".repeat(64), replaceExisting: false });
  assert.match(sql, /INSERT OR IGNORE INTO users/i);
  assert.doesNotMatch(sql, /UPDATE users/i);
  assert.match(sql, /'superadmin'/i);
});

test("overwrite eksplisit merotasi hash, mengaktifkan akun, dan merevoke sesi", () => {
  const sql = buildProvisioningSql({ email: "admin@example.com", name: "Admin Recovery", passwordHash: "b".repeat(64), replaceExisting: true });
  assert.match(sql, /UPDATE users SET/i);
  assert.match(sql, /is_active = 1/i);
  assert.match(sql, /token_version = COALESCE\(token_version, 0\) \+ 1/i);
});

test("credential-equivalent tidak diteruskan melalui process arguments", async () => {
  const source = await readFile(new URL("../scripts/provision-admin.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /"--command",\s*sql/);
  assert.match(source, /"--file",\s*temporarySqlPath/);
  assert.match(source, /writeFile\(temporarySqlPath, sql, \{ mode: 0o600/);
  assert.match(source, /rm\(temporarySqlPath, \{ force: true \}\)/);
});
