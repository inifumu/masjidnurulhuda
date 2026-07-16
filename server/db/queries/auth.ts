type UserTokenVersionRow = {
  id: number;
  role: "superadmin" | "ketua" | "bendahara" | "pengurus";
  token_version: number;
  is_active: number;
};

export const getUserByEmail = async (db: D1Database, email: string) => {
  return await db
    .prepare(`SELECT id, email, password_hash, name,
      COALESCE(operational_role, role) AS role, token_version, is_active
      FROM users WHERE email = ?`)
    .bind(email)
    .first();
};

export const getUserTokenVersionById = async (
  db: D1Database,
  userId: number,
): Promise<UserTokenVersionRow | null> => {
  const row = await db
    .prepare("SELECT id, COALESCE(operational_role, role) AS role, token_version, is_active FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: number; role: UserTokenVersionRow["role"]; token_version: number | null; is_active: number | null }>();

  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    token_version:
      typeof row.token_version === "number" &&
      Number.isInteger(row.token_version)
        ? row.token_version
        : 0,
    is_active: row.is_active === 0 ? 0 : 1,
  };
};

export const bumpUserTokenVersion = async (
  db: D1Database,
  userId: number,
): Promise<boolean> => {
  const result = await db
    .prepare(
      "UPDATE users SET token_version = COALESCE(token_version, 0) + 1 WHERE id = ?",
    )
    .bind(userId)
    .run();

  return Boolean(result.success && (result.meta?.changes ?? 0) > 0);
};
