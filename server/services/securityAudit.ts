export type SecurityEventAction =
  | "login_succeeded"
  | "login_failed"
  | "login_rate_limited";

export const recordSecurityEvent = async (
  db: D1Database,
  action: SecurityEventAction,
  targetUserId: number | null = null,
) => db.prepare(`
  INSERT INTO security_audit_events (target_user_id, action, metadata_json)
  VALUES (?, ?, ?)
`).bind(targetUserId, action, "{}").run();
