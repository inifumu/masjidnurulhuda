type UserTokenVersionRow = {
  id: number;
  token_version: number;
};

export const getUserByEmail = async (db: D1Database, email: string) => {
  return await db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first();
};

export const getUserTokenVersionById = async (
  db: D1Database,
  userId: number,
): Promise<UserTokenVersionRow | null> => {
  const row = await db
    .prepare("SELECT id, token_version FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: number; token_version: number | null }>();

  if (!row) return null;
  return {
    id: row.id,
    token_version:
      typeof row.token_version === "number" &&
      Number.isInteger(row.token_version)
        ? row.token_version
        : 0,
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
