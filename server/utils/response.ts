import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { buildApiError, type ApiErrorCode, type FieldErrorMap } from "../../shared/contracts/index.ts";

// 🟢 Helper untuk Response Sukses (Menggunakan Generic <T>)
export const sendSuccess = <T = unknown>(
  c: Context,
  message: string,
  data: T | null = null,
  statusCode: ContentfulStatusCode = 200,
) => {
  return c.json(
    {
      status: "success",
      message,
      // Hanya tampilkan property 'data' kalau ada isinya
      ...(data !== null && data !== undefined && { data }),
    },
    statusCode,
  );
};

// 🔴 Helper untuk Response Error
export const sendError = (
  c: Context,
  message: string,
  statusCode: ContentfulStatusCode = 500,
  errors: unknown = null,
  code: ApiErrorCode = statusCode === 401 ? "UNAUTHORIZED"
    : statusCode === 403 ? "FORBIDDEN"
      : statusCode === 404 ? "NOT_FOUND"
        : statusCode === 409 ? "CONFLICT"
          : statusCode === 429 ? "RATE_LIMITED"
          : statusCode >= 500 ? "INTERNAL_ERROR" : "VALIDATION_ERROR",
) => {
  const fields = errors && typeof errors === "object" && !Array.isArray(errors)
    ? errors as FieldErrorMap : undefined;
  return c.json(buildApiError(code, message, fields), statusCode);
};
