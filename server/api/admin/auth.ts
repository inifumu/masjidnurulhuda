import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import * as authService from "../../services/auth.ts";
import { recordActorSecurityEvent, recordSecurityEvent } from "../../services/securityAudit.ts";
import { parseAuthJwtPayload, requireAuth, type AuthJwtPayload } from "../../middleware/auth.ts";
import { isAdminRole } from "../../../shared/contracts/index.ts";
import {
  bumpUserTokenVersion,
  getUserTokenVersionById,
} from "../../db/queries/auth.ts";
import { sendSuccess, sendError } from "../../utils/response.ts";
// 🟢 Import 3 Fungsi Helper Rate Limiter
import {
  checkLoginBlocked,
  getClientIp,
  recordLoginFailure,
  resetLoginFailures,
} from "../../middleware/rateLimit.ts";

const api = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>();
const IMPERSONATION_SECONDS = 15 * 60;
const sessionCookieOptions = (url: string, maxAge = 60 * 60 * 24) => ({
  path: "/", httpOnly: true, secure: new URL(url).protocol === "https:", sameSite: "Lax" as const, maxAge,
});

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

    const clientIp = getClientIp(c.req.raw.headers);
    const rateLimit = await checkLoginBlocked(c.env.DB, clientIp, email);
    if (rateLimit.blocked) {
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
      const failure = await recordLoginFailure(c.env.DB, clientIp, email);
      if (failure.blocked) {
        await recordSecurityEvent(c.env.DB, "login_rate_limited");
        c.header("Retry-After", String(failure.retryAfterSeconds));
        return sendError(
          c,
          "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
          429,
          undefined,
          "RATE_LIMITED",
        );
      }
      await recordSecurityEvent(c.env.DB, "login_failed");
      return sendError(c, "Kredensial tidak valid!", 401, undefined, "UNAUTHORIZED");
    }

    await resetLoginFailures(c.env.DB, clientIp, email);
    await recordSecurityEvent(c.env.DB, "login_succeeded", result.user.id);

    setCookie(c, "auth_token", result.token, sessionCookieOptions(c.req.url));

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

api.post("/impersonation/start", requireAuth, async (c) => {
  const current = c.get("jwtPayload") as AuthJwtPayload;
  if (current.role !== "superadmin" || current.impersonated_by || current.original_role) {
    return sendError(c, "Hanya superadmin asli yang dapat memulai mode samaran.", 403, undefined, "FORBIDDEN");
  }
  let body: unknown;
  try { body = await c.req.json(); } catch { return sendError(c, "Payload tidak valid.", 400, undefined, "VALIDATION_ERROR"); }
  const role = typeof body === "object" && body && "role" in body ? (body as { role?: unknown }).role : null;
  if (!isAdminRole(role) || role === "superadmin") {
    return sendError(c, "Role samaran tidak valid.", 400, undefined, "VALIDATION_ERROR");
  }
  const actorId = current.sub ?? current.id;
  if (!actorId || !c.env.JWT_SECRET) return sendError(c, "Sesi tidak valid.", 401, undefined, "UNAUTHORIZED");
  const principal = await getUserTokenVersionById(c.env.DB, actorId);
  if (!principal || principal.is_active !== 1 || principal.token_version !== current.tv) return sendError(c, "Sesi sudah tidak valid.", 401, undefined, "UNAUTHORIZED");
  if (principal.role !== "superadmin") return sendError(c, "Hanya superadmin aktif yang dapat memulai mode samaran.", 403, undefined, "FORBIDDEN");
  const now = Math.floor(Date.now() / 1000);
  const originalExp = typeof current.exp === "number" ? current.exp : now + 60 * 60 * 24;
  const expiresAt = Math.min(now + IMPERSONATION_SECONDS, originalExp);
  const token = await sign({ sub: actorId, id: actorId, name: current.name, role, original_role: "superadmin", impersonated_by: actorId, impersonation_started_at: now, impersonation_expires_at: expiresAt, original_exp: originalExp, tv: current.tv ?? 0, exp: expiresAt }, c.env.JWT_SECRET);
  await recordActorSecurityEvent(c.env.DB, actorId, "role_impersonation_started", { role });
  setCookie(c, "auth_token", token, sessionCookieOptions(c.req.url, IMPERSONATION_SECONDS));
  return sendSuccess(c, "Mode samaran aktif", { role, expires_at: expiresAt });
});

api.post("/impersonation/stop", requireAuth, async (c) => {
  const current = c.get("jwtPayload") as AuthJwtPayload;
  const actorId = current.sub ?? current.id;
  if (!actorId || current.original_role !== "superadmin" || current.impersonated_by !== actorId || !c.env.JWT_SECRET) {
    return sendError(c, "Mode samaran tidak aktif.", 409, undefined, "CONFLICT");
  }
  const now = Math.floor(Date.now() / 1000);
  const restoredExp = typeof current.original_exp === "number" ? current.original_exp : now;
  if (restoredExp <= now) return sendError(c, "Sesi asli sudah berakhir.", 401, undefined, "UNAUTHORIZED");
  const token = await sign({ sub: actorId, id: actorId, name: current.name, role: "superadmin", tv: current.tv ?? 0, exp: restoredExp }, c.env.JWT_SECRET);
  await recordActorSecurityEvent(c.env.DB, actorId, "role_impersonation_stopped", { role: current.role });
  setCookie(c, "auth_token", token, sessionCookieOptions(c.req.url));
  return sendSuccess(c, "Mode samaran dihentikan", { role: "superadmin" });
});

api.get("/me", async (c) => {
  const token = getCookie(c, "auth_token");
  if (!token) return sendError(c, "Tidak ada sesi", 401, undefined, "UNAUTHORIZED");

  try {
    const secret = c.env.JWT_SECRET;
    if (!secret) return sendError(c, "JWT secret belum dikonfigurasi", 500);

    const decoded = parseAuthJwtPayload(await verify(token, secret, "HS256"));
    if (!decoded) {
      deleteCookie(c, "auth_token", { path: "/" });
      return sendError(c, "Sesi tidak valid", 401, undefined, "UNAUTHORIZED");
    }
    const userId = decoded.sub!;

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

    const impersonationActive = decoded.original_role === "superadmin"
      && decoded.impersonated_by === userId
      && typeof decoded.impersonation_expires_at === "number";
    return sendSuccess(c, "Sesi valid", {
      id: userId,
      name: decoded.name,
      role: decoded.role,
      ...(impersonationActive ? { impersonation: {
        active: true, role: decoded.role, original_role: "superadmin", actor_id: userId,
        actor_name: decoded.name, expires_at: decoded.impersonation_expires_at,
      } } : {}),
    });
  } catch (err) {
    deleteCookie(c, "auth_token", { path: "/" });
    return sendError(c, "Sesi tidak valid", 401, undefined, "UNAUTHORIZED");
  }
});

export default api;
