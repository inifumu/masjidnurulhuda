const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type LoginRateLimitRow = {
  failure_count: number;
  blocked_until: number | null;
};

export type LoginRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

const hashLoginKey = async (ip: string, email: string): Promise<string> => {
  const normalized = `${ip.trim()}\n${email.trim().toLowerCase()}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};

export const consumeLoginAttempt = async (
  db: D1Database,
  ip: string,
  email: string,
  now = Date.now(),
): Promise<LoginRateLimitResult> => {
  const keyHash = await hashLoginKey(ip, email);
  const row = await db.prepare(`
    INSERT INTO login_rate_limits (
      key_hash, failure_count, window_started_at, blocked_until, updated_at
    ) VALUES (?, 1, ?, NULL, ?)
    ON CONFLICT(key_hash) DO UPDATE SET
      failure_count = CASE
        WHEN excluded.updated_at >= login_rate_limits.window_started_at + ? THEN 1
        ELSE login_rate_limits.failure_count + 1
      END,
      window_started_at = CASE
        WHEN excluded.updated_at >= login_rate_limits.window_started_at + ?
          THEN excluded.updated_at
        ELSE login_rate_limits.window_started_at
      END,
      blocked_until = CASE
        WHEN excluded.updated_at >= login_rate_limits.window_started_at + ? THEN NULL
        WHEN login_rate_limits.failure_count + 1 > ?
          THEN login_rate_limits.window_started_at + ?
        ELSE login_rate_limits.blocked_until
      END,
      updated_at = excluded.updated_at
    RETURNING failure_count, blocked_until
  `).bind(
    keyHash,
    now,
    now,
    WINDOW_MS,
    WINDOW_MS,
    WINDOW_MS,
    MAX_ATTEMPTS,
    WINDOW_MS,
  ).first<LoginRateLimitRow>();

  if (!row) throw new Error("Login rate limit tidak dapat diperbarui");
  if (row.failure_count <= MAX_ATTEMPTS || row.blocked_until === null) {
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((row.blocked_until - now) / 1000)),
  };
};

export const getClientIp = (headers: Headers): string =>
  headers.get("cf-connecting-ip")?.trim() || "unknown-ip";
