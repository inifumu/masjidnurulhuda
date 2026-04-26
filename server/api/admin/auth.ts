import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import * as authService from "../../services/auth";
import { sendSuccess, sendError } from "../../utils/response"; // 🟢 Import Helper

// Tambahkan JWT_SECRET ke Bindings agar TypeScript mengenalnya
const api = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>();

api.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return sendError(c, "JWT secret belum dikonfigurasi", 500);
    }
    const result = await authService.loginAdmin(
      c.env.DB,
      body.email,
      body.password,
      secret,
    );

    if (!result) {
      // 🔴 Ganti ke Helper Error
      return sendError(c, "Kredensial tidak valid!", 401);
    }

    setCookie(c, "auth_token", result.token, {
      path: "/",
      httpOnly: true,
      secure: new URL(c.req.url).protocol === "https:",
      sameSite: "Lax",
      maxAge: 60 * 60 * 24,
    });

    // 🟢 Ganti ke Helper Success
    return sendSuccess(c, "Login berhasil", result.user);
  } catch (error) {
    console.error("ERROR POST /login:", error);
    return sendError(c, "Terjadi kesalahan saat login", 500);
  }
});

api.post("/logout", (c) => {
  deleteCookie(c, "auth_token", { path: "/" });
  // 🟢 Ganti ke Helper Success (tanpa data)
  return sendSuccess(c, "Berhasil logout");
});

api.get("/me", async (c) => {
  const token = getCookie(c, "auth_token");

  if (!token) {
    // 🔴 Standarisasi: Kembalikan 401 jika tidak ada token, bukan 200
    return sendError(c, "Tidak ada sesi", 401);
  }

  try {
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return sendError(c, "JWT secret belum dikonfigurasi", 500);
    }
    const decoded = await verify(token, secret, "HS256");

    // 🟢 Ganti ke Helper Success
    return sendSuccess(c, "Sesi valid", {
      id: decoded.sub,
      name: decoded.name,
      role: decoded.role,
    });
  } catch (err) {
    deleteCookie(c, "auth_token", { path: "/" });
    // 🔴 Standarisasi: Kembalikan 401
    return sendError(c, "Sesi tidak valid", 401);
  }
});

export default api;
