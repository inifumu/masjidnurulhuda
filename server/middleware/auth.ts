import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { sendError } from "../utils/response"; // 🟢 Import Helper Error

/**
 * 1. SATPAM PINTU UTAMA (Cek Login)
 * Memastikan user punya token yang valid sebelum masuk.
 */
export const requireAuth = async (c: any, next: any) => {
  const token = getCookie(c, "auth_token");
  // 🔴 Pakai Helper Error
  if (!token) return sendError(c, "Unauthorized", 401);

  try {
    const secret = c.env?.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET tidak ditemukan di environment!");

    const decoded = await verify(token, secret, "HS256");
    c.set("jwtPayload", decoded); // Simpan KTP user
    await next(); // Silakan lewat!
  } catch (err) {
    // 🔴 Pakai Helper Error
    return sendError(c, "Invalid token", 401);
  }
};

/**
 * 2. SATPAM KHUSUS (Cek Role/Jabatan)
 * Memastikan hanya role tertentu yang boleh mengeksekusi endpoint.
 * (Wajib dipasang SETELAH requireAuth)
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (c: any, next: any) => {
    const user = c.get("jwtPayload");

    if (!user || !allowedRoles.includes(user.role)) {
      // 🔴 Pakai Helper Error
      return sendError(
        c,
        "Forbidden: Anda tidak memiliki hak akses untuk aksi ini.",
        403,
      );
    }

    await next(); // Silakan lewat!
  };
};
