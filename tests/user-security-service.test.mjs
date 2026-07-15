import test from "node:test";
import assert from "node:assert/strict";
import {
  AccountPolicyError,
  createUser,
  setUserActive,
  updateUser,
  resetPassword,
} from "../server/services/user.ts";

const statement = (sql, firstRow = null) => ({
  sql: sql.replace(/\s+/g, " ").trim(), values: [],
  bind(...values) { this.values = values; return this; },
  async first() { return firstRow; },
});

const dbFor = (target, activeSuperadmins = 2) => {
  const batches = [];
  const db = {
    prepare(sql) {
      if (/SELECT id, COALESCE\(operational_role, role\) AS role, is_active FROM users WHERE id/.test(sql)) return statement(sql, target);
      if (/COUNT\(\*\).*COALESCE\(operational_role, role\) = 'superadmin'/.test(sql.replace(/\s+/g, " "))) return statement(sql, { count: activeSuperadmins });
      return statement(sql);
    },
    async batch(items) {
      batches.push(items);
      const guarded = items[0].sql.includes("EXISTS (") && items[0].values.at(-2) === 1;
      const changes = guarded && activeSuperadmins <= 1 ? 0 : 1;
      return items.map(() => ({ success: true, meta: { changes } }));
    },
  };
  return { db, batches };
};

test("disable akun membump token_version dan menulis audit tanpa data sensitif", async () => {
  const { db, batches } = dbFor({ id: 9, role: "pengurus", is_active: 1 });
  await setUserActive(db, 1, 9, false);
  assert.match(batches[0][0].sql, /is_active = \?, token_version = COALESCE\(token_version, 0\) \+ 1/);
  assert.match(batches[0][1].sql, /INSERT INTO security_audit_events/);
  assert.deepEqual(batches[0][1].values.slice(0, 3), [1, 9, "account_disabled"]);
  assert.doesNotMatch(String(batches[0][1].values[3]), /password|token|cookie/i);
});

test("actor tidak dapat disable dirinya sendiri", async () => {
  const { db } = dbFor({ id: 1, role: "superadmin", is_active: 1 });
  await assert.rejects(() => setUserActive(db, 1, 1, false), (error) => error instanceof AccountPolicyError && error.code === "SELF_LOCKOUT");
});

test("superadmin aktif terakhir tidak dapat didisable atau didemote", async () => {
  const { db } = dbFor({ id: 9, role: "superadmin", is_active: 1 }, 1);
  await assert.rejects(() => setUserActive(db, 1, 9, false), /superadmin aktif terakhir/i);
  await assert.rejects(() => updateUser(db, 1, 9, "pengurus", "Target"), /superadmin aktif terakhir/i);
});

test("perubahan role dan password membump token version serta diaudit", async () => {
  const roleDb = dbFor({ id: 9, role: "pengurus", is_active: 1 });
  await updateUser(roleDb.db, 1, 9, "ketua", "Target");
  assert.match(roleDb.batches[0][0].sql, /token_version = COALESCE\(token_version, 0\) \+ 1/);
  assert.match(roleDb.batches[0][1].sql, /'account_updated'/);

  const passwordDb = dbFor({ id: 9, role: "pengurus", is_active: 1 });
  await resetPassword(passwordDb.db, 1, 9, "password-baru");
  assert.match(passwordDb.batches[0][0].sql, /token_version = COALESCE\(token_version, 0\) \+ 1/);
  assert.equal(passwordDb.batches[0][1].values[2], "password_reset");
  assert.doesNotMatch(String(passwordDb.batches[0][1].values[3]), /password-baru/);
});

test("create account menulis audit event tanpa password", async () => {
  const statements = [];
  const db = {
    prepare(sql) {
      const item = statement(sql);
      statements.push(item);
      return item;
    },
    async batch(items) {
      return items.map((_, index) => ({
        success: true,
        meta: { changes: 1, last_row_id: index === 0 ? 12 : undefined },
      }));
    },
  };

  await createUser(db, 1, {
    email: "target@example.com",
    password: "rahasia-baru",
    name: "Target",
    role: "pengurus",
  });

  assert.match(statements[0].sql, /INSERT INTO users/);
  assert.match(statements[1].sql, /INSERT INTO security_audit_events/);
  assert.match(statements[1].sql, /'account_created'/);
  assert.doesNotMatch(JSON.stringify(statements[1].values), /rahasia-baru/);
});
