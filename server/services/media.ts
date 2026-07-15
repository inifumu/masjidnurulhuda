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
  countMediaReferences,
  enqueueMediaDeletion,
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
  thumb_url: `/api/public/${row.thumb_storage_key ?? deriveThumbStorageKey(row.storage_key)}`,
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

  const createdKeys: string[] = [];
  const putIfAbsent = async (key: string, body: ArrayBuffer, contentType: string) => {
    const created = await env.MEDIA_BUCKET.put(key, body, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      onlyIf: { etagDoesNotMatch: "*" },
    });
    if (!created) {
      throw new MediaDomainError("Storage key media sudah digunakan", 409);
    }
    createdKeys.push(key);
  };

  try {
    await putIfAbsent(storageKey, fileBuffer, file.type);
    await putIfAbsent(thumbStorageKey, thumbFileBuffer, thumbFile.type);
    const created = await insertMedia(env.DB, {
      file_url: `/api/public/${storageKey}`,
      storage_key: storageKey,
      thumb_storage_key: thumbStorageKey,
      kategori_penggunaan: category,
      alt_text: altText,
      mime_type: file.type as "image/webp" | "image/jpeg" | "image/png",
      size_bytes: Math.max(file.size, thumbFile.size),
      width,
      height,
      uploaded_by: uploadedBy,
    });

    if (!created) {
      throw new MediaDomainError("Gagal menyimpan metadata media", 500);
    }

    return toMediaResponseItem(created);
  } catch (error) {
    await Promise.allSettled(createdKeys.map((key) => env.MEDIA_BUCKET.delete(key)));
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
    existing.thumb_storage_key ?? deriveThumbStorageKey(existing.storage_key),
  ].filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  const references = await countMediaReferences(env.DB, id);
  if (Number(references?.total ?? 0) > 0) {
    throw new MediaDomainError("Media masih direferensikan", 409);
  }
  const results = await enqueueMediaDeletion(env.DB, existing, keysToDelete);
  if ((results[0]?.meta?.changes ?? 0) !== 1) {
    throw new MediaDomainError("Media masih direferensikan atau sudah diproses", 409);
  }
  if (results.slice(1).some((result) => (result.meta?.changes ?? 0) !== 1)) {
    throw new MediaDomainError("Antrean penghapusan media gagal disimpan", 500);
  }
  return { id };
};

type OutboxRow = { id: number; media_id: number; storage_key: string };
export const processMediaDeletionOutbox = async (env: MediaBindings, options: { limit?: number } = {}) => {
  const limit = Math.max(1, Math.min(options.limit ?? 25, 100));
  const rows = await env.DB.prepare(`SELECT id, media_id, storage_key FROM media_deletion_outbox WHERE status IN ('pending','failed') AND next_attempt_at <= CURRENT_TIMESTAMP ORDER BY id LIMIT ?`).bind(limit).all<OutboxRow>();
  let processed = 0;
  for (const job of rows.results ?? []) {
    try {
      await env.MEDIA_BUCKET.delete(job.storage_key);
      await env.DB.prepare("UPDATE media_deletion_outbox SET status = 'completed', attempts = attempts + 1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, last_error = NULL WHERE id = ?").bind(job.id).run();
      await env.DB.prepare(`UPDATE dokumentasi SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP, deletion_error = NULL WHERE id = ? AND status IN ('pending_delete','delete_failed') AND NOT EXISTS (SELECT 1 FROM media_deletion_outbox WHERE media_id = ? AND status != 'completed')`).bind(job.media_id, job.media_id).run();
      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await env.DB.prepare("UPDATE media_deletion_outbox SET status = 'failed', attempts = attempts + 1, last_error = ?, next_attempt_at = datetime(CURRENT_TIMESTAMP, '+' || MIN(attempts + 1, 60) || ' minutes'), updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(message, job.id).run();
      await env.DB.prepare("UPDATE dokumentasi SET status = 'delete_failed', deletion_error = ? WHERE id = ? AND status = 'pending_delete'").bind(message, job.media_id).run();
    }
  }
  return { processed, attempted: rows.results?.length ?? 0 };
};

export const reconcileMediaDeletions = async (env: MediaBindings) => {
  const result = await env.DB.prepare(`UPDATE dokumentasi SET status = 'delete_failed', deletion_error = 'missing deletion outbox' WHERE status = 'pending_delete' AND NOT EXISTS (SELECT 1 FROM media_deletion_outbox o WHERE o.media_id = dokumentasi.id)`).bind().run();
  return { markedFailed: result.meta.changes ?? 0 };
};
