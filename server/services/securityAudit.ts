export type SecurityEventAction =
  | "login_succeeded"
  | "login_failed"
  | "login_rate_limited"
  | "role_impersonation_started"
  | "role_impersonation_stopped";

export const recordSecurityEvent = async (
  db: D1Database,
  action: SecurityEventAction,
  targetUserId: number | null = null,
) => db.prepare(`
  INSERT INTO security_audit_events (target_user_id, action, metadata_json)
  VALUES (?, ?, ?)
`).bind(targetUserId, action, "{}").run();

export const recordActorSecurityEvent = async (
  db: D1Database, actorId: number, action: SecurityEventAction,
  metadata: Record<string, unknown> = {},
) => db.prepare(`
  INSERT INTO security_audit_events (actor_id, target_user_id, action, metadata_json)
  VALUES (?, ?, ?, ?)
`).bind(actorId, actorId, action, JSON.stringify(metadata)).run();
