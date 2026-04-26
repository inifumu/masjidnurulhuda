import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// 🟢 Helper untuk Response Sukses
export const sendSuccess = (
  c: Context,
  message: string,
  data: any = null,
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
  errors: any = null,
) => {
  return c.json(
    {
      status: "error",
      message,
      // Field 'errors' dipakai kalau ada list error validasi form (array/object)
      ...(errors !== null && errors !== undefined && { errors }),
    },
    statusCode,
  );
};
