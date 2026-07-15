import test from "node:test";
import assert from "node:assert/strict";
import {
  checkLoginBlocked,
  recordLoginFailure,
  resetLoginFailures,
} from "../server/middleware/rateLimit.ts";

const createDb = () => {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      return {
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() {
          const key = this.values[0];
          if (normalized.startsWith("SELECT blocked_until")) {
            const row = rows.get(key);
            return row ? { blocked_until: row.blockedUntil } : null;
          }
          assert.match(normalized, /INSERT INTO login_rate_limits/i);
          assert.match(normalized, /ON CONFLICT\s*\(key_hash\) DO UPDATE/i);
          const now = this.values[1];
          const windowMs = this.values[3];
          const maxAttempts = this.values[6];
          const current = rows.get(key);
          const expired = !current || now >= current.windowStartedAt + windowMs;
          const failureCount = expired ? 1 : current.failureCount + 1;
          const windowStartedAt = expired ? now : current.windowStartedAt;
          const blockedUntil = failureCount > maxAttempts ? windowStartedAt + windowMs : null;
          rows.set(key, { failureCount, windowStartedAt, blockedUntil });
          return { failure_count: failureCount, blocked_until: blockedUntil };
        },
        async run() {
          assert.match(normalized, /DELETE FROM login_rate_limits WHERE key_hash = \?/i);
          const existed = rows.delete(this.values[0]);
          return { success: true, meta: { changes: existed ? 1 : 0 } };
        },
      };
    },
  };
};

test("lima failure diizinkan dan failure keenam memblokir secara atomic", async () => {
  const db = createDb();
  const now = 1_000_000;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assert.deepEqual(await checkLoginBlocked(db, "203.0.113.7", "ADMIN@EXAMPLE.COM ", now), { blocked: false });
    assert.deepEqual(await recordLoginFailure(db, "203.0.113.7", "ADMIN@EXAMPLE.COM ", now), { blocked: false });
  }
  assert.deepEqual(await recordLoginFailure(db, "203.0.113.7", "admin@example.com", now), { blocked: true, retryAfterSeconds: 900 });
  assert.deepEqual(await checkLoginBlocked(db, "203.0.113.7", "admin@example.com", now), { blocked: true, retryAfterSeconds: 900 });
});

test("reset sukses membersihkan failure bucket dan tidak membuat bucket baru", async () => {
  const db = createDb();
  await recordLoginFailure(db, "203.0.113.7", "admin@example.com", 1_000_000);
  assert.equal(db.rows.size, 1);
  await resetLoginFailures(db, "203.0.113.7", " ADMIN@example.com ");
  assert.equal(db.rows.size, 0);
  await resetLoginFailures(db, "203.0.113.7", "admin@example.com");
  assert.equal(db.rows.size, 0);
});

test("window expired tidak memblokir dan key hanya SHA-256 pasangan ternormalisasi", async () => {
  const db = createDb();
  await recordLoginFailure(db, " 203.0.113.7 ", "ADMIN@example.com ", 1_000_000);
  assert.deepEqual(await checkLoginBlocked(db, "203.0.113.7", "admin@example.com", 1_900_000), { blocked: false });
  const [key] = db.rows.keys();
  assert.match(key, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(key, /admin|203/);
});

test("bucket berbeda untuk pasangan IP dan email berbeda", async () => {
  const db = createDb();
  await recordLoginFailure(db, "203.0.113.7", "admin@example.com", 1_000_000);
  await recordLoginFailure(db, "203.0.113.8", "admin@example.com", 1_000_000);
  await recordLoginFailure(db, "203.0.113.7", "other@example.com", 1_000_000);
  assert.equal(db.rows.size, 3);
});
