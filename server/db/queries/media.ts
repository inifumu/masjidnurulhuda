/**
 * Tujuan:
 * - Layer query domain media untuk akses D1 tabel `dokumentasi`.
 *
 * Caller:
 * - `server/services/media.ts`
 *
 * Dependensi:
 * - Cloudflare D1 binding (`D1Database`)
 *
 * Main Functions:
 * - insert/list/count/get/delete/update metadata media.
 *
 * Side Effects:
 * - Operasi baca/tulis ke tabel `dokumentasi`.
 */

export type MediaCategory = "general" | "artikel" | "profil" | "galeri";

export type MediaRow = {
  id: number;
  file_url: string;
  storage_key: string;
  kategori_penggunaan: MediaCategory;
  alt_text: string | null;
  mime_type: "image/webp" | "image/jpeg" | "image/png";
  size_bytes: number;
  width: number | null;
  height: number | null;
  uploaded_by: number;
  created_at: string;
};

export const insertMedia = async (
  db: D1Database,
  payload: {
    file_url: string;
    storage_key: string;
    kategori_penggunaan: MediaCategory;
    alt_text: string | null;
    mime_type: "image/webp" | "image/jpeg" | "image/png";
    size_bytes: number;
    width: number | null;
    height: number | null;
    uploaded_by: number;
  },
) => {
  return db
    .prepare(
      `
      INSERT INTO dokumentasi (
        file_url,
        storage_key,
        kategori_penggunaan,
        alt_text,
        mime_type,
        size_bytes,
        width,
        height,
        uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING
        id, file_url, storage_key, kategori_penggunaan, alt_text, mime_type,
        size_bytes, width, height, uploaded_by, created_at
      `,
    )
    .bind(
      payload.file_url,
      payload.storage_key,
      payload.kategori_penggunaan,
      payload.alt_text,
      payload.mime_type,
      payload.size_bytes,
      payload.width,
      payload.height,
      payload.uploaded_by,
    )
    .first<MediaRow>();
};

export const getMediaById = async (db: D1Database, id: number) => {
  return db
    .prepare(
      `
      SELECT
        id, file_url, storage_key, kategori_penggunaan, alt_text, mime_type,
        size_bytes, width, height, uploaded_by, created_at
      FROM dokumentasi
      WHERE id = ?
      `,
    )
    .bind(id)
    .first<MediaRow>();
};

export const countMedia = async (
  db: D1Database,
  category?: MediaCategory | null,
) => {
  if (category) {
    return db
      .prepare(
        "SELECT COUNT(*) as total FROM dokumentasi WHERE kategori_penggunaan = ?",
      )
      .bind(category)
      .first<{ total: number | string }>();
  }

  return db
    .prepare("SELECT COUNT(*) as total FROM dokumentasi")
    .first<{ total: number | string }>();
};

export const listMedia = async (
  db: D1Database,
  pagination: { limit: number; offset: number },
  category?: MediaCategory | null,
) => {
  if (category) {
    return db
      .prepare(
        `
        SELECT
          id, file_url, storage_key, kategori_penggunaan, alt_text, mime_type,
          size_bytes, width, height, uploaded_by, created_at
        FROM dokumentasi
        WHERE kategori_penggunaan = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        `,
      )
      .bind(category, pagination.limit, pagination.offset)
      .all<MediaRow>();
  }

  return db
    .prepare(
      `
      SELECT
        id, file_url, storage_key, kategori_penggunaan, alt_text, mime_type,
        size_bytes, width, height, uploaded_by, created_at
      FROM dokumentasi
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
    )
    .bind(pagination.limit, pagination.offset)
    .all<MediaRow>();
};

export const deleteMediaById = async (db: D1Database, id: number) => {
  return db.prepare("DELETE FROM dokumentasi WHERE id = ?").bind(id).run();
};

export const updateMediaMetadataById = async (
  db: D1Database,
  id: number,
  updates: {
    alt_text?: string | null;
    kategori_penggunaan?: MediaCategory;
  },
) => {
  const setClauses: string[] = [];
  const binds: Array<string | number | null> = [];

  if (Object.prototype.hasOwnProperty.call(updates, "alt_text")) {
    setClauses.push("alt_text = ?");
    binds.push(updates.alt_text ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "kategori_penggunaan")) {
    setClauses.push("kategori_penggunaan = ?");
    binds.push(updates.kategori_penggunaan ?? null);
  }

  setClauses.push("updated_at = CURRENT_TIMESTAMP");
  binds.push(id);

  return db
    .prepare(
      `
      UPDATE dokumentasi
      SET ${setClauses.join(", ")}
      WHERE id = ?
      RETURNING
        id, file_url, storage_key, kategori_penggunaan, alt_text, mime_type,
        size_bytes, width, height, uploaded_by, created_at
      `,
    )
    .bind(...binds)
    .first<MediaRow>();
};
