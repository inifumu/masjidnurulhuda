import test from "node:test";
import assert from "node:assert/strict";
import { consumeLoginAttempt } from "../server/middleware/rateLimit.ts";

const createDb = () => {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      return {
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() {
          assert.match(sql, /INSERT INTO login_rate_limits/i);
          assert.match(sql, /ON CONFLICT\s*\(key_hash\) DO UPDATE/i);
          assert.match(sql, /RETURNING failure_count, blocked_until/i);
          const keyHash = this.values[0];
          const now = this.values[1];
          const windowMs = this.values[3];
          const maxAttempts = this.values[6];
          const current = rows.get(keyHash);
          const expired = !current || now >= current.windowStartedAt + windowMs;
          const failureCount = expired ? 1 : current.failureCount + 1;
          const windowStartedAt = expired ? now : current.windowStartedAt;
          const blockedUntil = failureCount > maxAttempts ? windowStartedAt + windowMs : null;
          rows.set(keyHash, { failureCount, windowStartedAt, blockedUntil });
          return { failure_count: failureCount, blocked_until: blockedUntil };
        },
      };
    },
  };
};

test("persistent limiter mengizinkan lima request lalu menolak request keenam secara atomic", async () => {
  const db = createDb();
  const now = 1_000_000;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assert.deepEqual(await consumeLoginAttempt(db, "203.0.113.7", "ADMIN@EXAMPLE.COM ", now), { allowed: true });
  }
  const blocked = await consumeLoginAttempt(db, "203.0.113.7", "admin@example.com", now);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 900);
});

test("bucket expired direset deterministik dan key tersimpan sebagai SHA-256", async () => {
  const db = createDb();
  const first = await consumeLoginAttempt(db, "203.0.113.7", "admin@example.com", 1_000_000);
  const reset = await consumeLoginAttempt(db, "203.0.113.7", "admin@example.com", 1_900_000);
  assert.deepEqual(first, { allowed: true });
  assert.deepEqual(reset, { allowed: true });
  const [key] = db.rows.keys();
  assert.match(key, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(key, /admin|203/);
});

test("key berbeda untuk pasangan IP dan email berbeda", async () => {
  const db = createDb();
  await consumeLoginAttempt(db, "203.0.113.7", "admin@example.com", 1_000_000);
  await consumeLoginAttempt(db, "203.0.113.8", "admin@example.com", 1_000_000);
  await consumeLoginAttempt(db, "203.0.113.7", "other@example.com", 1_000_000);
  assert.equal(db.rows.size, 3);
});
