export const getUserByEmail = async (db: D1Database, email: string) => {
  return await db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first();
};
