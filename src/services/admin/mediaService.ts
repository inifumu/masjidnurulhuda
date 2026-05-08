/**
 * Tujuan:
 * - Service layer Media Library admin untuk komunikasi API `/api/admin/media`.
 *
 * Caller:
 * - composable admin media upload/list/delete.
 *
 * Dependensi:
 * - httpClient.
 *
 * Main Functions:
 * - uploadMedia
 * - listMedia
 * - updateMediaMetadata
 * - deleteMedia
 *
 * Side Effects:
 * - Network I/O ke backend Hono.
 */

import { httpClient } from "../httpClient";

export type MediaUsageCategory = "general" | "artikel" | "profil" | "galeri";

export interface MediaItem {
  id: number;
  file_url: string;
  storage_key: string;
  thumb_url: string;
  kategori_penggunaan: MediaUsageCategory;
  alt_text: string | null;
  mime_type: "image/webp" | "image/jpeg" | "image/png";
  size_bytes: number;
  width: number | null;
  height: number | null;
  uploaded_by: number;
  created_at: string;
}

export interface UploadMediaPayload {
  file: File;
  thumb_file: File;
  storage_key: string;
  thumb_storage_key: string;
  kategori_penggunaan: MediaUsageCategory;
  alt_text?: string;
  width?: number;
  height?: number;
}

export interface ListMediaParams {
  page?: number;
  limit?: number;
  kategori_penggunaan?: MediaUsageCategory;
}

export interface UpdateMediaMetadataPayload {
  alt_text?: string | null;
  kategori_penggunaan?: MediaUsageCategory;
}

interface ApiEnvelope<T> {
  status: string;
  message: string;
  data: T;
}

interface ListMediaData {
  items: MediaItem[];
  page: number;
  limit: number;
  total: number;
}

function buildPublicMediaUrl(storageKey: string): string {
  const key = storageKey.trim().replace(/^\/+/, "");
  if (!key.startsWith("media/")) return "";
  const remainder = key.slice("media/".length).replace(/^\/+/, "");
  return remainder ? `/api/public/media/${remainder}` : "";
}

function normalizeMediaUrl(url: string, storageKey: string): string {
  const canonicalFromStorageKey = buildPublicMediaUrl(storageKey);
  if (canonicalFromStorageKey) {
    return canonicalFromStorageKey;
  }

  const rawUrl = url.trim();
  if (rawUrl.startsWith("/api/public/media/media/")) {
    return rawUrl.replace("/api/public/media/media/", "/api/public/media/");
  }

  if (rawUrl.startsWith("/api/public/media/")) {
    return rawUrl;
  }

  if (rawUrl.startsWith("/media/")) {
    return `/api/public${rawUrl}`;
  }

  return rawUrl;
}

function normalizeMediaItem(item: MediaItem): MediaItem {
  const normalizedFileUrl = normalizeMediaUrl(item.file_url, item.storage_key);
  const normalizedThumbUrl = normalizeMediaUrl(item.thumb_url, "");
  return {
    ...item,
    file_url: normalizedFileUrl,
    thumb_url: normalizedThumbUrl,
  };
}

function toFormData(payload: UploadMediaPayload): FormData {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("thumb_file", payload.thumb_file);
  formData.append("storage_key", payload.storage_key);
  formData.append("thumb_storage_key", payload.thumb_storage_key);
  formData.append("kategori_penggunaan", payload.kategori_penggunaan);

  if (payload.alt_text?.trim()) {
    formData.append("alt_text", payload.alt_text.trim());
  }

  if (typeof payload.width === "number" && Number.isFinite(payload.width)) {
    formData.append("width", String(payload.width));
  }

  if (typeof payload.height === "number" && Number.isFinite(payload.height)) {
    formData.append("height", String(payload.height));
  }

  return formData;
}

export const mediaService = {
  async uploadMedia(payload: UploadMediaPayload): Promise<MediaItem> {
    const response = await httpClient<ApiEnvelope<MediaItem>>(
      "/api/admin/media",
      {
        method: "POST",
        body: toFormData(payload),
        isFormData: true,
      },
    );
    return normalizeMediaItem(response.data);
  },

  async listMedia(params: ListMediaParams = {}): Promise<ListMediaData> {
    const query: Record<string, string> = {};

    if (typeof params.page === "number") query.page = String(params.page);
    if (typeof params.limit === "number") query.limit = String(params.limit);
    if (params.kategori_penggunaan) {
      query.kategori_penggunaan = params.kategori_penggunaan;
    }

    const response = await httpClient<ApiEnvelope<ListMediaData>>(
      "/api/admin/media",
      { params: query },
    );
    return {
      ...response.data,
      items: response.data.items.map(normalizeMediaItem),
    };
  },

  async updateMediaMetadata(
    id: number,
    payload: UpdateMediaMetadataPayload,
  ): Promise<MediaItem> {
    const response = await httpClient<ApiEnvelope<MediaItem>>(
      `/api/admin/media/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return normalizeMediaItem(response.data);
  },

  async deleteMedia(id: number): Promise<{ id: number }> {
    const response = await httpClient<ApiEnvelope<{ id: number }>>(
      `/api/admin/media/${id}`,
      { method: "DELETE" },
    );
    return response.data;
  },
};
