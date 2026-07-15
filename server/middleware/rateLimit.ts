const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

type LoginRateLimitRow = {
  failure_count: number;
  blocked_until: number | null;
};

export type LoginBlockResult =
  | { blocked: false }
  | { blocked: true; retryAfterSeconds: number };

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

const blockResult = (
  blockedUntil: number | null | undefined,
  now: number,
): LoginBlockResult => {
  if (blockedUntil === null || blockedUntil === undefined || blockedUntil <= now) {
    return { blocked: false };
  }
  return {
    blocked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil - now) / 1000)),
  };
};

export const checkLoginBlocked = async (
  db: D1Database,
  ip: string,
  email: string,
  now = Date.now(),
): Promise<LoginBlockResult> => {
  const keyHash = await hashLoginKey(ip, email);
  const row = await db.prepare(
    "SELECT blocked_until FROM login_rate_limits WHERE key_hash = ?",
  ).bind(keyHash).first<{ blocked_until: number | null }>();
  return blockResult(row?.blocked_until, now);
};

export const recordLoginFailure = async (
  db: D1Database,
  ip: string,
  email: string,
  now = Date.now(),
): Promise<LoginBlockResult> => {
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
    MAX_FAILURES,
    WINDOW_MS,
  ).first<LoginRateLimitRow>();

  if (!row) throw new Error("Login failure tidak dapat dicatat");
  return blockResult(row.blocked_until, now);
};

export const resetLoginFailures = async (
  db: D1Database,
  ip: string,
  email: string,
): Promise<void> => {
  const keyHash = await hashLoginKey(ip, email);
  await db.prepare("DELETE FROM login_rate_limits WHERE key_hash = ?")
    .bind(keyHash)
    .run();
};

export const getClientIp = (headers: Headers): string =>
  headers.get("cf-connecting-ip")?.trim() || "unknown-ip";
