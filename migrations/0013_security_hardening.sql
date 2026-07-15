-- Migration number: 0013
-- Tujuan: persistent login rate limiting, lifecycle akun non-destruktif,
-- revocation sesi, dan audit event keamanan secara additive.

ALTER TABLE users
  ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1
  CHECK(is_active IN (0, 1));

CREATE TABLE login_rate_limits (
  key_hash TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK(failure_count >= 0),
  window_started_at INTEGER NOT NULL,
  blocked_until INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_login_rate_limits_blocked_until
  ON login_rate_limits (blocked_until);

CREATE TABLE security_audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER,
  target_user_id INTEGER,
  action TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_security_audit_events_actor_created
  ON security_audit_events (actor_id, created_at DESC);

CREATE INDEX idx_security_audit_events_target_created
  ON security_audit_events (target_user_id, created_at DESC);
