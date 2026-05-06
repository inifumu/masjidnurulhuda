// server/services/user.ts

// Helper untuk Hash Password bawaan Cloudflare Workers (Web Crypto API)
const hashPassword = async (password: string) => {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const getUsers = async (db: D1Database) => {
  return await db
    .prepare("SELECT id, email, name, role FROM users ORDER BY id DESC")
    .all();
};

// 🟢 UPDATE: Tambahkan "bendahara" di tipe UserRole
export type UserRole = "superadmin" | "ketua" | "bendahara" | "pengurus";

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export const createUser = async (db: D1Database, data: CreateUserPayload) => {
  const hashedPassword = await hashPassword(data.password);
  return await db
    .prepare(
      "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
    )
    .bind(data.email, hashedPassword, data.name, data.role)
    .run();
};

export const updateUserRole = async (
  db: D1Database,
  id: number,
  role: UserRole,
  name: string,
) => {
  return await db
    .prepare("UPDATE users SET role = ?, name = ? WHERE id = ?")
    .bind(role, name, id)
    .run();
};

export const resetPassword = async (
  db: D1Database,
  id: number,
  newPassword: string,
) => {
  const hashedPassword = await hashPassword(newPassword);
  return await db
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(hashedPassword, id)
    .run();
};

export const deleteUser = async (db: D1Database, id: number) => {
  return await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
};
