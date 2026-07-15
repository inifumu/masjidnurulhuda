import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import * as authService from "../../services/auth.ts";
import { recordSecurityEvent } from "../../services/securityAudit.ts";
import {
  bumpUserTokenVersion,
  getUserTokenVersionById,
} from "../../db/queries/auth.ts";
import { sendSuccess, sendError } from "../../utils/response.ts";
// 🟢 Import 3 Fungsi Helper Rate Limiter
import {
  consumeLoginAttempt,
  getClientIp,
} from "../../middleware/rateLimit.ts";

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
    const rateLimit = await consumeLoginAttempt(
      c.env.DB,
      getClientIp(c.req.raw.headers),
      email,
    );
    if (!rateLimit.allowed) {
      await recordSecurityEvent(c.env.DB, "login_rate_limited");
      c.header("Retry-After", String(rateLimit.retryAfterSeconds));
      return sendError(
        c,
        "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
        429,
        undefined,
        "RATE_LIMITED",
      );
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
      await recordSecurityEvent(c.env.DB, "login_failed");
      return sendError(c, "Kredensial tidak valid!", 401, undefined, "UNAUTHORIZED");
    }

    await recordSecurityEvent(c.env.DB, "login_succeeded", result.user.id);

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

api.post("/logout", async (c) => {
  const token = getCookie(c, "auth_token");

  if (token) {
    try {
      const secret = c.env.JWT_SECRET;
      if (secret) {
        const decoded = await verify(token, secret, "HS256");
        const userId =
          typeof decoded.sub === "number"
            ? decoded.sub
            : typeof decoded.id === "number"
              ? decoded.id
              : null;

        if (userId) {
          await bumpUserTokenVersion(c.env.DB, userId);
        }
      }
    } catch {
      // noop: tetap lanjutkan clear cookie agar logout idempotent.
    }
  }

  deleteCookie(c, "auth_token", { path: "/" });
  return sendSuccess(c, "Berhasil logout");
});

api.get("/me", async (c) => {
  const token = getCookie(c, "auth_token");
  if (!token) return sendError(c, "Tidak ada sesi", 401, undefined, "UNAUTHORIZED");

  try {
    const secret = c.env.JWT_SECRET;
    if (!secret) return sendError(c, "JWT secret belum dikonfigurasi", 500);

    const decoded = await verify(token, secret, "HS256");
    const userId =
      typeof decoded.sub === "number"
        ? decoded.sub
        : typeof decoded.id === "number"
          ? decoded.id
          : null;

    if (!userId) {
      deleteCookie(c, "auth_token", { path: "/" });
      return sendError(c, "Sesi tidak valid", 401, undefined, "UNAUTHORIZED");
    }

    const userVersion = await getUserTokenVersionById(c.env.DB, userId);
    if (!userVersion) {
      deleteCookie(c, "auth_token", { path: "/" });
      return sendError(c, "Sesi tidak valid", 401, undefined, "UNAUTHORIZED");
    }

    const tokenVersion =
      typeof decoded.tv === "number" && Number.isInteger(decoded.tv)
        ? decoded.tv
        : 0;

    if (userVersion.is_active !== 1 || tokenVersion !== userVersion.token_version) {
      deleteCookie(c, "auth_token", { path: "/" });
      return sendError(c, "Sesi sudah tidak valid", 401, undefined, "UNAUTHORIZED");
    }

    return sendSuccess(c, "Sesi valid", {
      id: userId,
      name: decoded.name,
      role: decoded.role,
    });
  } catch (err) {
    deleteCookie(c, "auth_token", { path: "/" });
    return sendError(c, "Sesi tidak valid", 401, undefined, "UNAUTHORIZED");
  }
});

export default api;
