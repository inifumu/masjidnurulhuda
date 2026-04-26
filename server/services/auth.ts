import { sign } from "hono/jwt";
import { getUserByEmail } from "../db/queries/auth";
import { hashPassword } from "../utils/crypto";

// ❌ Teks hardcoded JWT_SECRET sudah kita musnahkan dari sini!

export const loginAdmin = async (
  db: D1Database,
  email: string,
  password: string,
  secret: string, // 🟢 1. Tambahkan parameter 'secret' untuk menangkap operan dari API
) => {
  const user: any = await getUserByEmail(db, email);
  if (!user) return null;

  // Cocokkan hash password input dengan yang ada di database
  const hashedInput = await hashPassword(password);
  if (user.password_hash !== hashedInput) return null;

  // Buat Payload JWT (kedaluwarsa dalam 1 hari)
  const payload = {
    sub: user.id,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  };

  // 🟢 2. Gunakan 'secret' yang dilempar dari API untuk menandatangani token
  const token = await sign(payload, secret);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
};
