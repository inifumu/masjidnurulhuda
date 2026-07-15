import test from "node:test";
import assert from "node:assert/strict";
import { recordSecurityEvent } from "../server/services/securityAudit.ts";

const createDb = () => {
  const statements = [];
  return {
    statements,
    prepare(sql) {
      const statement = {
        sql: sql.replace(/\s+/g, " ").trim(), values: [],
        bind(...values) { this.values = values; return this; },
        async run() { return { success: true, meta: { changes: 1 } }; },
      };
      statements.push(statement);
      return statement;
    },
  };
};

test("security login event menyimpan action dan target tanpa data sensitif", async () => {
  const db = createDb();
  await recordSecurityEvent(db, "login_succeeded", 7);

  assert.match(db.statements[0].sql, /INSERT INTO security_audit_events/);
  assert.deepEqual(db.statements[0].values, [7, "login_succeeded", "{}"]);
  assert.doesNotMatch(JSON.stringify(db.statements[0].values), /email|password|token|cookie|203\.0\.113/i);
});

test("failed dan rate-limited login dapat diaudit tanpa user target", async () => {
  const db = createDb();
  await recordSecurityEvent(db, "login_failed");
  await recordSecurityEvent(db, "login_rate_limited");

  assert.deepEqual(db.statements.map((item) => item.values), [
    [null, "login_failed", "{}"],
    [null, "login_rate_limited", "{}"],
  ]);
});
