/**
 * Tujuan:
 * - Endpoint admin media library: upload, list, patch metadata, dan delete media.
 *
 * Caller:
 * - Frontend admin via mediaService (`/api/admin/media`).
 *
 * Dependensi:
 * - middleware auth (requireAuth + requireRole)
 * - helper response (sendSuccess/sendError)
 * - media service (`server/services/media.ts`)
 *
 * Main Functions:
 * - POST / (validasi request + delegasi upload ke service)
 * - GET / (filter + pagination)
 * - PATCH /:id (update metadata)
 * - DELETE /:id (hapus media sinkron R2 + D1)
 *
 * Side Effects:
 * - I/O ke R2 dan D1 melalui layer service.
 */

import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  requireAuth,
  requireRole,
  type AuthJwtPayload,
} from "../../middleware/auth.ts";
import { sendError, sendSuccess } from "../../utils/response.ts";
import {
  getMediaList,
  MediaDomainError,
  patchMediaMetadata,
  removeMedia,
  uploadMedia,
  VALID_CATEGORIES,
  type MediaCategory,
} from "../../services/media.ts";

type AppBindings = {
  DB: D1Database;
  JWT_SECRET: string;
  MEDIA_BUCKET: R2Bucket;
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 36;
const STORAGE_KEY_PREFIX = "media/";
const HTTP_BAD_REQUEST: ContentfulStatusCode = 400;
const HTTP_UNAUTHORIZED: ContentfulStatusCode = 401;
const HTTP_CREATED: ContentfulStatusCode = 201;
const HTTP_INTERNAL_ERROR: ContentfulStatusCode = 500;

const parsePositiveInt = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const parseOptionalDimension = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const api = new Hono<{
  Bindings: AppBindings;
  Variables: { requestId: string };
}>();

api.use("/*", requireAuth);
api.use("/*", requireRole(["superadmin", "ketua", "bendahara", "pengurus"]));

api.post("/", async (c) => {
  try {
    const form = await c.req.formData();

    const file = form.get("file");
    const thumbFile = form.get("thumb_file");
    const storageKeyRaw = form.get("storage_key");
    const thumbStorageKeyRaw = form.get("thumb_storage_key");
    const categoryRaw = form.get("kategori_penggunaan");
    const altTextRaw = form.get("alt_text");
    const widthRaw = form.get("width");
    const heightRaw = form.get("height");

    if (!(file instanceof File)) {
      return sendError(c, "File wajib diisi", HTTP_BAD_REQUEST);
    }

    if (!(thumbFile instanceof File)) {
      return sendError(c, "thumb_file wajib diisi", HTTP_BAD_REQUEST);
    }

    const storageKey =
      typeof storageKeyRaw === "string" ? storageKeyRaw.trim() : "";
    if (!storageKey) {
      return sendError(c, "storage_key wajib diisi", HTTP_BAD_REQUEST);
    }
    if (!storageKey.startsWith(STORAGE_KEY_PREFIX)) {
      return sendError(
        c,
        "storage_key harus diawali 'media/'",
        HTTP_BAD_REQUEST,
      );
    }

    const thumbStorageKey =
      typeof thumbStorageKeyRaw === "string" ? thumbStorageKeyRaw.trim() : "";
    if (!thumbStorageKey) {
      return sendError(c, "thumb_storage_key wajib diisi", HTTP_BAD_REQUEST);
    }
    if (!thumbStorageKey.startsWith(STORAGE_KEY_PREFIX)) {
      return sendError(
        c,
        "thumb_storage_key harus diawali 'media/'",
        HTTP_BAD_REQUEST,
      );
    }

    const category =
      typeof categoryRaw === "string"
        ? (categoryRaw.trim() as MediaCategory)
        : null;
    if (!category || !VALID_CATEGORIES.has(category)) {
      return sendError(c, "kategori_penggunaan tidak valid", HTTP_BAD_REQUEST);
    }

    const width = parseOptionalDimension(
      typeof widthRaw === "string" ? widthRaw : null,
    );
    const height = parseOptionalDimension(
      typeof heightRaw === "string" ? heightRaw : null,
    );

    if ((widthRaw && width === null) || (heightRaw && height === null)) {
      return sendError(
        c,
        "width/height harus integer positif",
        HTTP_BAD_REQUEST,
      );
    }

    const payload = c.get("jwtPayload") as AuthJwtPayload | undefined;
    const uploadedBy =
      typeof payload?.id === "number"
        ? payload.id
        : typeof payload?.sub === "number"
          ? payload.sub
          : null;

    if (!uploadedBy) {
      return sendError(c, "Token user tidak valid", HTTP_UNAUTHORIZED);
    }

    const altText =
      typeof altTextRaw === "string" && altTextRaw.trim()
        ? altTextRaw.trim()
        : null;

    const created = await uploadMedia(c.env, {
      file,
      thumbFile,
      storageKey,
      thumbStorageKey,
      category,
      altText,
      width,
      height,
      uploadedBy,
    });

    return sendSuccess(c, "Media berhasil diupload", created, HTTP_CREATED);
  } catch (error) {
    const requestId = c.get("requestId") ?? "unknown-request-id";
    console.error("[media][POST /api/admin/media] upload_failed", {
      operation: "upload_media",
      route: "/api/admin/media",
      requestId,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : String(error),
    });

    if (error instanceof MediaDomainError) {
      return sendError(c, error.message, error.statusCode);
    }

    return sendError(c, "Gagal upload media", HTTP_INTERNAL_ERROR);
  }
});

api.patch("/:id", async (c) => {
  try {
    const id = parsePositiveInt(c.req.param("id"));
    if (!id) return sendError(c, "ID media tidak valid", 400);

    const body = await c.req.json<{
      alt_text?: string | null;
      kategori_penggunaan?: MediaCategory;
    }>();

    const hasAltText = Object.prototype.hasOwnProperty.call(body, "alt_text");
    const hasCategory = Object.prototype.hasOwnProperty.call(
      body,
      "kategori_penggunaan",
    );

    if (!hasAltText && !hasCategory) {
      return sendError(c, "Minimal satu field harus dikirim", 400);
    }

    const updates: {
      alt_text?: string | null;
      kategori_penggunaan?: MediaCategory;
    } = {};

    if (hasAltText) {
      const rawAlt = body.alt_text;
      if (rawAlt !== null && typeof rawAlt !== "string") {
        return sendError(c, "alt_text harus string atau null", 400);
      }
      updates.alt_text =
        typeof rawAlt === "string" && rawAlt.trim() ? rawAlt.trim() : null;
    }

    if (hasCategory) {
      const rawCategory = body.kategori_penggunaan;
      if (
        typeof rawCategory !== "string" ||
        !VALID_CATEGORIES.has(rawCategory as MediaCategory)
      ) {
        return sendError(c, "kategori_penggunaan tidak valid", 400);
      }
      updates.kategori_penggunaan = rawCategory as MediaCategory;
    }

    const updated = await patchMediaMetadata(c.env, id, updates);

    return sendSuccess(c, "Metadata media berhasil diperbarui", updated);
  } catch (error) {
    const requestId = c.get("requestId") ?? "unknown-request-id";
    console.error(
      "[media][PATCH /api/admin/media/:id] metadata_update_failed",
      {
        operation: "update_media_metadata",
        route: "/api/admin/media/:id",
        requestId,
        error:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : String(error),
      },
    );

    if (error instanceof MediaDomainError) {
      return sendError(c, error.message, error.statusCode);
    }

    return sendError(c, "Gagal memperbarui metadata media", 500);
  }
});

api.get("/", async (c) => {
  try {
    const categoryRaw = c.req.query("kategori_penggunaan");
    const pageRaw = c.req.query("page");
    const limitRaw = c.req.query("limit");

    const page = parsePositiveInt(pageRaw ?? null) ?? 1;
    const limitParsed = parsePositiveInt(limitRaw ?? null);
    const limit =
      limitParsed && limitParsed <= MAX_LIMIT ? limitParsed : DEFAULT_LIMIT;

    let categoryFilter: MediaCategory | null = null;
    if (categoryRaw) {
      if (!VALID_CATEGORIES.has(categoryRaw as MediaCategory)) {
        return sendError(c, "kategori_penggunaan tidak valid", 400);
      }
      categoryFilter = categoryRaw as MediaCategory;
    }

    const result = await getMediaList(c.env, {
      page,
      limit,
      category: categoryFilter,
    });

    const requestId = c.get("requestId") ?? "unknown-request-id";
    console.log("[media][GET /api/admin/media] list_request", {
      route: "/api/admin/media",
      requestId,
      requestContext: {
        page_raw: pageRaw ?? null,
        limit_raw: limitRaw ?? null,
        kategori_penggunaan: categoryRaw ?? null,
      },
      effectiveQuery: {
        page,
        limit,
        category: categoryFilter,
      },
      resultCount: result.items.length,
      total: result.total,
      hasMore: result.page * result.limit < result.total,
    });

    c.header("Cache-Control", "private, max-age=15, stale-while-revalidate=30");
    c.header("Vary", "Authorization");

    return sendSuccess(c, "Berhasil memuat media library", result);
  } catch (error) {
    const requestId = c.get("requestId") ?? "unknown-request-id";
    console.error("[media][GET /api/admin/media] list_failed", {
      operation: "list_media",
      route: "/api/admin/media",
      requestId,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : String(error),
    });

    if (error instanceof MediaDomainError) {
      return sendError(c, error.message, error.statusCode);
    }

    return sendError(c, "Gagal memuat media library", 500);
  }
});

api.delete("/:id", async (c) => {
  try {
    const id = parsePositiveInt(c.req.param("id"));
    if (!id) return sendError(c, "ID media tidak valid", 400);

    const deleted = await removeMedia(c.env, id);
    return sendSuccess(c, "Media berhasil dihapus", deleted);
  } catch (error) {
    const requestId = c.get("requestId") ?? "unknown-request-id";
    console.error("[media][DELETE /api/admin/media/:id] delete_failed", {
      operation: "delete_media",
      route: "/api/admin/media/:id",
      requestId,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : String(error),
    });

    if (error instanceof MediaDomainError) {
      return sendError(c, error.message, error.statusCode);
    }

    return sendError(c, "Gagal menghapus media", 500);
  }
});

export default api;
