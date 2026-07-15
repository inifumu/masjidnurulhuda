import type { AdminRole } from "../../shared/contracts/index.ts";
import { hashPassword } from "../utils/crypto.ts";

export type UserRole = AdminRole;

type AccountRow = { id: number; role: UserRole; is_active: number };

export class AccountPolicyError extends Error {
  readonly code: "SELF_LOCKOUT" | "LAST_ACTIVE_SUPERADMIN" | "ACCOUNT_NOT_FOUND";

  constructor(
    message: string,
    code: "SELF_LOCKOUT" | "LAST_ACTIVE_SUPERADMIN" | "ACCOUNT_NOT_FOUND",
  ) {
    super(message);
    this.name = "AccountPolicyError";
    this.code = code;
  }
}

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

const getAccount = async (db: D1Database, id: number): Promise<AccountRow> => {
  const row = await db.prepare(
    "SELECT id, COALESCE(operational_role, role) AS role, is_active FROM users WHERE id = ?",
  ).bind(id).first<AccountRow>();
  if (!row) throw new AccountPolicyError("Akun tidak ditemukan", "ACCOUNT_NOT_FOUND");
  return row;
};

const assertMutationApplied = (results: D1Result<unknown>[]) => {
  if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) {
    throw new AccountPolicyError(
      "Superadmin aktif terakhir tidak boleh dinonaktifkan atau didemote",
      "LAST_ACTIVE_SUPERADMIN",
    );
  }
  return results;
};

const auditStatement = (
  db: D1Database,
  actorId: number,
  targetId: number,
  action: string,
  metadata: Record<string, unknown> = {},
) => db.prepare(`
  INSERT INTO security_audit_events (actor_id, target_user_id, action, metadata_json)
  VALUES (?, ?, ?, ?)
`).bind(actorId, targetId, action, JSON.stringify(metadata));

export const getUsers = async (db: D1Database) => db.prepare(
  "SELECT id, email, name, COALESCE(operational_role, role) AS role, is_active FROM users ORDER BY id DESC",
).all();

export const createUser = async (
  db: D1Database,
  actorId: number,
  data: CreateUserPayload,
) => {
  const hashedPassword = await hashPassword(data.password);
  return db.batch([
    db.prepare(
      "INSERT INTO users (email, password_hash, name, role, operational_role) VALUES (?, ?, ?, ?, ?)",
    ).bind(data.email, hashedPassword, data.name, data.role === "bendahara" ? "pengurus" : data.role, data.role),
    db.prepare(`
      INSERT INTO security_audit_events (
        actor_id, target_user_id, action, metadata_json
      )
      SELECT ?, id, 'account_created', ? FROM users WHERE email = ?
    `).bind(actorId, JSON.stringify({ role: data.role }), data.email),
  ]);
};

export const updateUser = async (
  db: D1Database,
  actorId: number,
  id: number,
  role: UserRole,
  name: string,
) => {
  const target = await getAccount(db, id);
  if (actorId === id && role !== target.role) {
    throw new AccountPolicyError("Role akun sendiri tidak boleh diubah", "SELF_LOCKOUT");
  }
  const removesActiveSuperadmin = target.role === "superadmin" && target.is_active === 1 && role !== "superadmin";
  const results = await db.batch([
    db.prepare(`UPDATE users SET role = ?, operational_role = ?, name = ?,
      token_version = COALESCE(token_version, 0) + 1
      WHERE id = ? AND (? = 0 OR EXISTS (
        SELECT 1 FROM users recovery WHERE recovery.id <> ?
          AND COALESCE(recovery.operational_role, recovery.role) = 'superadmin' AND recovery.is_active = 1
      ))`).bind(role === "bendahara" ? "pengurus" : role, role, name, id, removesActiveSuperadmin ? 1 : 0, id),
    db.prepare(`INSERT INTO security_audit_events (actor_id, target_user_id, action, metadata_json)
      SELECT ?, ?, 'account_updated', ? WHERE changes() = 1`)
      .bind(actorId, id, JSON.stringify({ previous_role: target.role, role })),
  ]);
  return assertMutationApplied(results);
};

export const resetPassword = async (
  db: D1Database,
  actorId: number,
  id: number,
  newPassword: string,
) => {
  await getAccount(db, id);
  const hashedPassword = await hashPassword(newPassword);
  return db.batch([
    db.prepare(`UPDATE users SET password_hash = ?,
      token_version = COALESCE(token_version, 0) + 1 WHERE id = ?`).bind(hashedPassword, id),
    auditStatement(db, actorId, id, "password_reset"),
  ]);
};

export const setUserActive = async (
  db: D1Database,
  actorId: number,
  id: number,
  isActive: boolean,
) => {
  const target = await getAccount(db, id);
  if (actorId === id && !isActive) {
    throw new AccountPolicyError("Akun sendiri tidak boleh dinonaktifkan", "SELF_LOCKOUT");
  }
  const removesActiveSuperadmin = target.role === "superadmin" && target.is_active === 1 && !isActive;
  const results = await db.batch([
    db.prepare(`UPDATE users SET is_active = ?,
      token_version = COALESCE(token_version, 0) + 1
      WHERE id = ? AND (? = 0 OR EXISTS (
        SELECT 1 FROM users recovery WHERE recovery.id <> ?
          AND COALESCE(recovery.operational_role, recovery.role) = 'superadmin' AND recovery.is_active = 1
      ))`).bind(isActive ? 1 : 0, id, removesActiveSuperadmin ? 1 : 0, id),
    db.prepare(`INSERT INTO security_audit_events (actor_id, target_user_id, action, metadata_json)
      SELECT ?, ?, ?, ? WHERE changes() = 1`)
      .bind(actorId, id, isActive ? "account_enabled" : "account_disabled", JSON.stringify({})),
  ]);
  return assertMutationApplied(results);
};
