import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import type { Context, Next } from "hono";
import { getUserTokenVersionById } from "../db/queries/auth.ts";
import { sendError } from "../utils/response.ts";
import { isAdminRole, type AdminRole } from "../../shared/contracts/index.ts";

type AuthBindings = {
  DB: D1Database;
  JWT_SECRET?: string;
};

export type AuthRole = AdminRole;

export type AuthJwtPayload = {
  sub?: number;
  id?: number;
  role?: AuthRole;
  name?: string;
  tv?: number;
  original_role?: "superadmin";
  impersonated_by?: number;
  impersonation_started_at?: number;
  impersonation_expires_at?: number;
  original_exp?: number;
  exp?: number;
  [key: string]: unknown;
};

type AuthEnv = {
  Bindings: AuthBindings;
  Variables: {
    jwtPayload: AuthJwtPayload;
  };
};

const positiveInteger = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value > 0;

export const parseAuthJwtPayload = (value: unknown, now = Math.floor(Date.now() / 1000)): AuthJwtPayload | null => {
  if (!value || typeof value !== "object") return null;
  const payload = value as AuthJwtPayload;
  if (!positiveInteger(payload.sub) || payload.id !== payload.sub || !isAdminRole(payload.role) || !Number.isInteger(payload.tv) || !positiveInteger(payload.exp) || payload.exp <= now) return null;
  const claims = [payload.original_role, payload.impersonated_by, payload.impersonation_started_at, payload.impersonation_expires_at, payload.original_exp];
  if (!claims.some((claim) => claim !== undefined)) return payload;
  if (payload.original_role !== "superadmin" || payload.role === "superadmin" || payload.impersonated_by !== payload.sub) return null;
  if (!positiveInteger(payload.impersonation_started_at) || !positiveInteger(payload.impersonation_expires_at) || !positiveInteger(payload.original_exp)) return null;
  if (payload.impersonation_started_at > now || payload.impersonation_expires_at <= now || payload.exp > payload.impersonation_expires_at || payload.exp > payload.original_exp) return null;
  return payload;
};

export const requireAuth = async (c: Context<AuthEnv>, next: Next) => {
  const token = getCookie(c, "auth_token");
  if (!token) return sendError(c, "Unauthorized", 401, undefined, "UNAUTHORIZED");

  try {
    const secret = c.env?.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET tidak ditemukan di environment!");

    const decoded = parseAuthJwtPayload(await verify(token, secret, "HS256"));
    if (!decoded) return sendError(c, "Invalid token", 401, undefined, "UNAUTHORIZED");
    const userId = decoded.sub!;

    const userVersion = await getUserTokenVersionById(c.env.DB, userId);
    if (!userVersion) {
      return sendError(c, "Invalid token", 401, undefined, "UNAUTHORIZED");
    }

    const tokenVersion =
      typeof decoded.tv === "number" && Number.isInteger(decoded.tv)
        ? decoded.tv
        : 0;

    if (userVersion.is_active !== 1 || tokenVersion !== userVersion.token_version) {
      return sendError(c, "Sesi sudah tidak valid", 401, undefined, "UNAUTHORIZED");
    }

    c.set("jwtPayload", decoded);
    await next();
  } catch (err) {
    return sendError(c, "Invalid token", 401, undefined, "UNAUTHORIZED");
  }
};

export const requireRole = (allowedRoles: AuthRole[]) => {
  return async (c: Context<AuthEnv>, next: Next) => {
    const user = c.get("jwtPayload");

    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      return sendError(
        c,
        "Forbidden: Anda tidak memiliki hak akses untuk aksi ini.",
        403,
        undefined,
        "FORBIDDEN",
      );
    }

    await next();
  };
};
