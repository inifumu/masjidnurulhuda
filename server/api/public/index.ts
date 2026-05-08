import { Hono } from "hono";

// Import semua router spesifik
import kasApi from "./kas.ts";
import jadwalApi from "./jadwal.ts";
import { resolveMediaStorageKey } from "../../utils/mediaPath.ts";
// import seksiApi from "./seksi"; // Buka komentar ini jika seksi.ts sudah siap
// import galeriApi from "./galeri";

const api = new Hono<{
  Bindings: { MEDIA_BUCKET: R2Bucket };
  Variables: { requestId: string };
}>();

// Daftarkan routing (semua akan memiliki prefix /api/public/...)
api.route("/kas", kasApi);
api.route("/jadwal", jadwalApi);
// api.route("/seksi", seksiApi);
// api.route("/galeri", galeriApi);

api.get("/media/*", async (c) => {
  try {
    const requestUrl = new URL(c.req.url);
    const storageKey = resolveMediaStorageKey({
      pathname: requestUrl.pathname,
      wildcardPath: c.req.param("*") ?? "",
    });

    if (!storageKey) {
      return c.text("Media key tidak valid", 400);
    }

    const requestId = c.get("requestId") ?? "unknown-request-id";

    let object = await c.env.MEDIA_BUCKET.get(storageKey);

    // Backward compatibility:
    // - format lama thumbnail: ".thumb.webp"
    // - format baru thumbnail: "-thumb.webp"
    let usedLegacyThumbFallback = false;
    if (!object) {
      const legacyThumbKey = storageKey.endsWith("-thumb.webp")
        ? storageKey.replace(/-thumb\.webp$/i, ".thumb.webp")
        : null;
      if (legacyThumbKey) {
        object = await c.env.MEDIA_BUCKET.get(legacyThumbKey);
        usedLegacyThumbFallback = Boolean(object);
      }
    }

    if (usedLegacyThumbFallback) {
      c.executionCtx.waitUntil(
        Promise.resolve().then(() => {
          console.info(
            "[media][GET /api/public/media/*] legacy_thumb_fallback_hit",
            {
              route: "/api/public/media/*",
              requestId,
              storageKey,
            },
          );
        }),
      );
    }

    if (!object) {
      return c.text("Media tidak ditemukan", 404);
    }

    const contentType =
      object.httpMetadata?.contentType ?? "application/octet-stream";
    const cacheControl =
      object.httpMetadata?.cacheControl ??
      "public, max-age=31536000, immutable";

    return new Response(object.body, {
      headers: {
        "content-type": contentType,
        ...(cacheControl ? { "cache-control": cacheControl } : {}),
        etag: object.httpEtag,
        "x-request-id": requestId,
      },
      status: 200,
    });
  } catch (error) {
    const requestId = c.get("requestId") ?? "unknown-request-id";
    console.error("[media][GET /api/public/media/*] request_failed", {
      route: "/api/public/media/*",
      requestId,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : String(error),
    });
    return c.text("Gagal memuat media", 500);
  }
});

export default api;
