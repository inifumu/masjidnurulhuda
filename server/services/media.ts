/**
 * Tujuan:
 * - Layer service domain media untuk orkestrasi validasi bisnis, I/O R2, dan query D1.
 *
 * Caller:
 * - `server/api/admin/media.ts`
 *
 * Dependensi:
 * - `server/db/queries/media.ts`
 * - R2 binding (`MEDIA_BUCKET`)
 *
 * Main Functions:
 * - upload media + rollback orphan object jika insert D1 gagal
 * - list media (filter + pagination)
 * - update metadata media
 * - delete media sinkron R2 lalu D1
 *
 * Side Effects:
 * - I/O ke R2 dan D1.
 */

import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  countMedia,
  deleteMediaById,
  getMediaById,
  insertMedia,
  listMedia,
  type MediaCategory as MediaCategoryQuery,
  type MediaRow,
  updateMediaMetadataById,
} from "../db/queries/media.ts";

export type MediaResponseItem = MediaRow & {
  thumb_url: string;
};

export type MediaCategory = MediaCategoryQuery;

type MediaBindings = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
};

const MAX_UPLOAD_BYTES = 2_500_000; // 2.5 MB guard server-side
const DEFAULT_LIST_LIMIT = 12;
const MAX_LIST_LIMIT = 36;

export const VALID_CATEGORIES = new Set<MediaCategory>([
  "general",
  "artikel",
  "profil",
  "galeri",
]);

export const VALID_MIME = new Set(["image/webp", "image/jpeg", "image/png"]);

export const deriveThumbStorageKey = (storageKey: string): string => {
  const normalized = storageKey.trim().replace(/^\/+/, "");
  if (!normalized.endsWith(".webp")) return `${normalized}-thumb`;
  return normalized.replace(/\.webp$/i, "-thumb.webp");
};

export const toMediaResponseItem = (row: MediaRow): MediaResponseItem => ({
  ...row,
  thumb_url: `/api/public/${deriveThumbStorageKey(row.storage_key)}`,
});

export class MediaDomainError extends Error {
  statusCode: ContentfulStatusCode;

  constructor(message: string, statusCode: ContentfulStatusCode = 400) {
    super(message);
    this.name = "MediaDomainError";
    this.statusCode = statusCode;
  }
}

const asDomainError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof MediaDomainError) return error;
  return new MediaDomainError(fallbackMessage, 500);
};

export const uploadMedia = async (
  env: MediaBindings,
  payload: {
    file: File;
    thumbFile: File;
    storageKey: string;
    thumbStorageKey: string;
    category: MediaCategory;
    altText: string | null;
    width: number | null;
    height: number | null;
    uploadedBy: number;
  },
): Promise<MediaResponseItem> => {
  const {
    file,
    thumbFile,
    storageKey,
    thumbStorageKey,
    category,
    altText,
    width,
    height,
    uploadedBy,
  } = payload;

  if (!VALID_CATEGORIES.has(category)) {
    throw new MediaDomainError("kategori_penggunaan tidak valid", 400);
  }

  if (!VALID_MIME.has(file.type) || !VALID_MIME.has(thumbFile.type)) {
    throw new MediaDomainError("Tipe file tidak didukung", 400);
  }

  if (file.size > MAX_UPLOAD_BYTES || thumbFile.size > MAX_UPLOAD_BYTES) {
    throw new MediaDomainError(
      `Ukuran file melebihi batas maksimum ${Math.floor(MAX_UPLOAD_BYTES / 1_000_000)} MB`,
      400,
    );
  }

  const fileBuffer = await file.arrayBuffer();
  const thumbFileBuffer = await thumbFile.arrayBuffer();

  await Promise.all([
    env.MEDIA_BUCKET.put(storageKey, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
    }),
    env.MEDIA_BUCKET.put(thumbStorageKey, thumbFileBuffer, {
      httpMetadata: {
        contentType: thumbFile.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
    }),
  ]);

  try {
    const created = await insertMedia(env.DB, {
      file_url: `/api/public/${storageKey}`,
      storage_key: storageKey,
      kategori_penggunaan: category,
      alt_text: altText,
      mime_type: file.type as "image/webp" | "image/jpeg" | "image/png",
      size_bytes: Math.max(file.size, thumbFile.size),
      width,
      height,
      uploaded_by: uploadedBy,
    });

    if (!created) {
      await Promise.allSettled([
        env.MEDIA_BUCKET.delete(storageKey),
        env.MEDIA_BUCKET.delete(thumbStorageKey),
      ]);
      throw new MediaDomainError("Gagal menyimpan metadata media", 500);
    }

    return toMediaResponseItem(created);
  } catch (error) {
    await Promise.allSettled([
      env.MEDIA_BUCKET.delete(storageKey),
      env.MEDIA_BUCKET.delete(thumbStorageKey),
    ]);
    throw asDomainError(error, "Gagal upload media");
  }
};

export const getMediaList = async (
  env: MediaBindings,
  options: {
    page: number;
    limit: number;
    category?: MediaCategory | null;
  },
) => {
  const page =
    Number.isInteger(options.page) && options.page > 0 ? options.page : 1;
  const limit =
    Number.isInteger(options.limit) &&
    options.limit > 0 &&
    options.limit <= MAX_LIST_LIMIT
      ? options.limit
      : DEFAULT_LIST_LIMIT;

  const totalRow = await countMedia(env.DB, options.category ?? null);
  const total =
    typeof totalRow?.total === "string"
      ? Number(totalRow.total)
      : (totalRow?.total ?? 0);

  const offset = (page - 1) * limit;
  const listed = await listMedia(
    env.DB,
    { limit, offset },
    options.category ?? null,
  );

  return {
    items: (listed.results ?? []).map(toMediaResponseItem),
    page,
    limit,
    total: Number.isFinite(total) ? total : 0,
  };
};

export const patchMediaMetadata = async (
  env: MediaBindings,
  id: number,
  updates: {
    alt_text?: string | null;
    kategori_penggunaan?: MediaCategory;
  },
): Promise<MediaResponseItem> => {
  const existing = await getMediaById(env.DB, id);
  if (!existing) {
    throw new MediaDomainError("Media tidak ditemukan", 404);
  }

  const updated = await updateMediaMetadataById(env.DB, id, updates);

  if (!updated) {
    throw new MediaDomainError("Gagal memperbarui metadata media", 500);
  }

  return toMediaResponseItem(updated);
};

export const removeMedia = async (
  env: MediaBindings,
  id: number,
): Promise<{ id: number }> => {
  const existing = await getMediaById(env.DB, id);
  if (!existing) {
    throw new MediaDomainError("Media tidak ditemukan", 404);
  }

  const keysToDelete = [
    existing.storage_key,
    deriveThumbStorageKey(existing.storage_key),
  ].filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  await Promise.all(keysToDelete.map((key) => env.MEDIA_BUCKET.delete(key)));
  await deleteMediaById(env.DB, id);

  return { id };
};
