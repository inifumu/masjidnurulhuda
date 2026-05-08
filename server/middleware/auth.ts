import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import type { Context, Next } from "hono";
import { sendError } from "../utils/response.ts";

type AuthBindings = {
  JWT_SECRET?: string;
};

export type AuthRole = "superadmin" | "ketua" | "bendahara" | "pengurus";

export type AuthJwtPayload = {
  sub?: number;
  id?: number;
  role?: AuthRole;
  [key: string]: unknown;
};

type AuthEnv = {
  Bindings: AuthBindings;
  Variables: {
    jwtPayload: AuthJwtPayload;
  };
};

export const requireAuth = async (c: Context<AuthEnv>, next: Next) => {
  const token = getCookie(c, "auth_token");
  if (!token) return sendError(c, "Unauthorized", 401);

  try {
    const secret = c.env?.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET tidak ditemukan di environment!");

    const decoded = (await verify(token, secret, "HS256")) as AuthJwtPayload;
    c.set("jwtPayload", decoded);
    await next();
  } catch (err) {
    return sendError(c, "Invalid token", 401);
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
      );
    }

    await next();
  };
};
