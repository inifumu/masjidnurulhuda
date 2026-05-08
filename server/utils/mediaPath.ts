/**
 * Tujuan:
 * - Menyediakan parser canonical untuk mengubah URL public media menjadi `storage_key` R2.
 *
 * Caller:
 * - server/api/public/index.ts (route GET /api/public/media/*)
 * - unit test parser media.
 *
 * Dependensi:
 * - Tidak ada (pure function).
 *
 * Main Functions:
 * - resolveMediaStorageKey
 *
 * Side Effects:
 * - Tidak ada.
 */

const MEDIA_PREFIX = "media/";
const PUBLIC_MEDIA_PATH_SEGMENT = "/api/public/media/";

function sanitizeMediaRemainder(input: string): string {
  const trimmed = input.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!trimmed) return "";

  const normalized = trimmed.replace(/\/{2,}/g, "/");
  if (normalized.includes("..")) return "";

  return normalized.startsWith(MEDIA_PREFIX)
    ? normalized.slice(MEDIA_PREFIX.length)
    : normalized;
}

export function resolveMediaStorageKey(params: {
  pathname: string;
  wildcardPath: string;
}): string | null {
  const pathname = params.pathname.trim();
  const wildcardPath = params.wildcardPath.trim();

  const fromPathname = pathname.startsWith(PUBLIC_MEDIA_PATH_SEGMENT)
    ? pathname.slice(PUBLIC_MEDIA_PATH_SEGMENT.length)
    : "";

  const remainder = sanitizeMediaRemainder(fromPathname || wildcardPath);
  if (!remainder) return null;

  return `${MEDIA_PREFIX}${remainder}`;
}
