import type { Context, Next } from "hono";
import { sendError } from "../utils/response.ts";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const securityHeaders = async (c: Context, next: Next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'",
  );
  if (new URL(c.req.url).protocol === "https:") {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
};

export const requireSameOrigin = async (c: Context, next: Next) => {
  if (SAFE_METHODS.has(c.req.method)) {
    await next();
    return;
  }

  const origin = c.req.header("Origin");
  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(c.req.url).origin;
  } catch {
    return sendError(c, "Origin request tidak valid.", 403, undefined, "FORBIDDEN");
  }

  if (!origin || origin !== expectedOrigin) {
    return sendError(c, "Origin request tidak diizinkan.", 403, undefined, "FORBIDDEN");
  }

  await next();
};
