import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import * as authService from "../../services/auth";
import { sendSuccess, sendError } from "../../utils/response";
// 🟢 Import 3 Fungsi Helper Rate Limiter
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
} from "../../middleware/rateLimit";

const api = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>();

// 🛡️ Hapus RateLimiter dari parameter, pindahkan logikanya ke dalam fungsi
api.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const email = body.email;
    const password = body.password;

    // 0️⃣ VALIDASI AWAL: Tolak mentah-mentah kalau kosong (HTTP 400 Bad Request)
    if (!email || !password) {
      return sendError(c, "Email dan password wajib diisi", 400);
    }

    // 1️⃣ CEK RATE LIMIT: Sekarang email dijamin ada isinya
    const rateLimit = checkLoginRateLimit(c, email);
    if (!rateLimit.allowed) {
      return sendError(c, rateLimit.message!, 429);
    }

    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return sendError(c, "JWT secret belum dikonfigurasi", 500);
    }

    const result = await authService.loginAdmin(
      c.env.DB,
      email,
      password,
      secret,
    );

    if (!result) {
      // 2️⃣ RECORD: Password salah
      recordFailedLogin(c, email);
      return sendError(c, "Kredensial tidak valid!", 401);
    }

    // 3️⃣ CLEAR: Berhasil login
    clearLoginAttempts(c, email);

    setCookie(c, "auth_token", result.token, {
      path: "/",
      httpOnly: true,
      secure: new URL(c.req.url).protocol === "https:",
      sameSite: "Lax",
      maxAge: 60 * 60 * 24,
    });

    return sendSuccess(c, "Login berhasil", result.user);
  } catch (error) {
    console.error("ERROR POST /login:", error);
    return sendError(c, "Terjadi kesalahan saat login", 500);
  }
});

api.post("/logout", (c) => {
  deleteCookie(c, "auth_token", { path: "/" });
  return sendSuccess(c, "Berhasil logout");
});

api.get("/me", async (c) => {
  const token = getCookie(c, "auth_token");
  if (!token) return sendError(c, "Tidak ada sesi", 401);

  try {
    const secret = c.env.JWT_SECRET;
    if (!secret) return sendError(c, "JWT secret belum dikonfigurasi", 500);

    const decoded = await verify(token, secret, "HS256");
    return sendSuccess(c, "Sesi valid", {
      id: decoded.sub,
      name: decoded.name,
      role: decoded.role,
    });
  } catch (err) {
    deleteCookie(c, "auth_token", { path: "/" });
    return sendError(c, "Sesi tidak valid", 401);
  }
});

export default api;
