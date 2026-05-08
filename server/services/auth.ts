import { sign } from "hono/jwt";
import { getUserByEmail } from "../db/queries/auth";
import { hashPassword } from "../utils/crypto";

// 🛡️ Buat Union Type yang ketat untuk Role
export type AuthRole = "superadmin" | "ketua" | "bendahara" | "pengurus";

// 🛡️ Tambahkan Interface DTO untuk hasil query Database
export interface AuthUserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: AuthRole;
  token_version?: number | null;
}

export const loginAdmin = async (
  db: D1Database,
  email: string,
  password: string,
  secret: string, // Parameter 'secret' untuk menangkap operan dari API
) => {
  // PERBAIKAN: Gunakan casting dengan interface AuthUserRow yang ketat
  const user = (await getUserByEmail(db, email)) as AuthUserRow | null;
  if (!user) return null;

  // Cocokkan hash password input dengan yang ada di database
  const hashedInput = await hashPassword(password);
  if (user.password_hash !== hashedInput) return null;

  const tokenVersion =
    typeof user.token_version === "number" &&
    Number.isInteger(user.token_version)
      ? user.token_version
      : 0;

  // Buat Payload JWT (kedaluwarsa dalam 1 hari)
  const payload = {
    sub: user.id,
    id: user.id,
    name: user.name,
    role: user.role,
    tv: tokenVersion,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  };

  // Gunakan 'secret' yang dilempar dari API untuk menandatangani token
  const token = await sign(payload, secret);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
};
