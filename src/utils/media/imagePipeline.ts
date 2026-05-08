/**
 * Tujuan:
 * - Pipeline optimasi gambar client-side untuk Media Library admin.
 *
 * Caller:
 * - composable upload media (contoh: useMediaUpload).
 *
 * Dependensi:
 * - browser-image-compression.
 *
 * Main Functions:
 * - processImageFile
 * - createStorageKeyFromFile
 *
 * Side Effects:
 * - Membuat object URL preview (wajib direvoke oleh caller jika tidak dipakai lagi).
 */

import imageCompression from "browser-image-compression";

export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";

export interface ProcessedImageResult {
  originalFile: File;
  processedFile: File;
  thumbFile: File;
  previewUrl: string;
  thumbPreviewUrl: string;
  mimeType: SupportedImageMime;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  sizeBytes: number;
  thumbSizeBytes: number;
  extension: "jpg" | "jpeg" | "png" | "webp";
}

export interface ImagePipelineOptions {
  /**
   * Target kualitas awal kompresi.
   * Tidak ada hard max dimensi/size yang memblokir UX upload.
   */
  initialQuality?: number;
  /**
   * Maksimal iterasi adaptive compression.
   */
  maxAttempts?: number;
  /**
   * Target size indikatif (bukan hard reject). Dipakai untuk adaptive pass.
   */
  targetSizeMB?: number;
  /**
   * Callback progress kompresi (0-100) real-time dari library.
   */
  onProgress?: (percent: number) => void;
}

export interface FileProcessError {
  code:
    | "UNSUPPORTED_MIME"
    | "READ_DIMENSION_FAILED"
    | "COMPRESSION_FAILED"
    | "CONVERT_FAILED";
  message: string;
}

const ALLOWED_MIME: SupportedImageMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function normalizeToJpegExt(ext: string): "jpg" | "jpeg" {
  return ext === "jpeg" ? "jpeg" : "jpg";
}

function getFileExtensionFromMime(
  mime: SupportedImageMime,
): "jpg" | "jpeg" | "png" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal membaca dimensi gambar"));
      img.src = objectUrl;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function adaptiveCompress(
  file: File,
  options: Required<Omit<ImagePipelineOptions, "onProgress">>,
  onProgress?: (percent: number) => void,
  maxWidthOrHeight?: number,
): Promise<File> {
  let quality = options.initialQuality;
  let bestAttemptFile = file;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    const compressedFromOriginal = await imageCompression(file, {
      maxSizeMB: options.targetSizeMB,
      initialQuality: quality,
      useWebWorker: true,
      exifOrientation: -1,
      fileType: "image/webp",
      maxWidthOrHeight,
      onProgress,
    });

    bestAttemptFile = compressedFromOriginal;

    if (compressedFromOriginal.size <= options.targetSizeMB * 1024 * 1024) {
      return compressedFromOriginal;
    }

    quality = Math.max(0.5, quality - 0.1);
  }

  return bestAttemptFile;
}

export async function processImageFile(
  file: File,
  opts: ImagePipelineOptions = {},
): Promise<ProcessedImageResult> {
  if (!ALLOWED_MIME.includes(file.type as SupportedImageMime)) {
    const error: FileProcessError = {
      code: "UNSUPPORTED_MIME",
      message: "Tipe file tidak didukung. Gunakan JPEG/PNG/WebP.",
    };
    throw error;
  }

  const options: Required<Omit<ImagePipelineOptions, "onProgress">> = {
    initialQuality: opts.initialQuality ?? 0.85,
    maxAttempts: opts.maxAttempts ?? 3,
    targetSizeMB: opts.targetSizeMB ?? 1.2,
  };

  let compressed: File;
  try {
    compressed = await adaptiveCompress(file, options, opts.onProgress);
  } catch {
    const error: FileProcessError = {
      code: "COMPRESSION_FAILED",
      message: "Kompresi gambar gagal diproses di browser.",
    };
    throw error;
  }

  const outputMime: SupportedImageMime = "image/webp";
  let renamedFile: File;

  try {
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    renamedFile = new File([compressed], `${baseName}.webp`, {
      type: outputMime,
      lastModified: Date.now(),
    });
  } catch {
    const error: FileProcessError = {
      code: "CONVERT_FAILED",
      message: "Konversi file ke format WebP gagal.",
    };
    throw error;
  }

  let dimension;
  try {
    dimension = await readImageDimensions(renamedFile);
  } catch {
    const error: FileProcessError = {
      code: "READ_DIMENSION_FAILED",
      message: "Gagal membaca dimensi gambar hasil optimasi.",
    };
    throw error;
  }

  let thumbCompressed: File;
  try {
    thumbCompressed = await adaptiveCompress(
      file,
      { ...options, targetSizeMB: Math.min(options.targetSizeMB, 0.25) },
      undefined,
      480,
    );
  } catch {
    const error: FileProcessError = {
      code: "COMPRESSION_FAILED",
      message: "Kompresi thumbnail gagal diproses di browser.",
    };
    throw error;
  }

  let thumbFile: File;
  try {
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    thumbFile = new File([thumbCompressed], `${baseName}.thumb.webp`, {
      type: outputMime,
      lastModified: Date.now(),
    });
  } catch {
    const error: FileProcessError = {
      code: "CONVERT_FAILED",
      message: "Konversi thumbnail ke format WebP gagal.",
    };
    throw error;
  }

  let thumbDimension;
  try {
    thumbDimension = await readImageDimensions(thumbFile);
  } catch {
    const error: FileProcessError = {
      code: "READ_DIMENSION_FAILED",
      message: "Gagal membaca dimensi thumbnail hasil optimasi.",
    };
    throw error;
  }

  const previewUrl = URL.createObjectURL(renamedFile);
  const thumbPreviewUrl = URL.createObjectURL(thumbFile);

  return {
    originalFile: file,
    processedFile: renamedFile,
    thumbFile,
    previewUrl,
    thumbPreviewUrl,
    mimeType: outputMime,
    width: dimension.width,
    height: dimension.height,
    thumbWidth: thumbDimension.width,
    thumbHeight: thumbDimension.height,
    sizeBytes: renamedFile.size,
    thumbSizeBytes: thumbFile.size,
    extension:
      getFileExtensionFromMime(outputMime) ?? normalizeToJpegExt("jpg"),
  };
}

function slugifyFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function getSafeDateParts(date: Date): { year: string; month: string } {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return { year, month };
}

function createUUID(): string {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createStorageKeyFromFile(
  originalName: string,
  extension: "jpg" | "jpeg" | "png" | "webp",
  now: Date = new Date(),
): string {
  const { year, month } = getSafeDateParts(now);
  const slug = slugifyFileName(originalName) || "media";
  const uuid = createUUID();
  return `media/${year}/${month}/${uuid}-${slug}.${extension}`;
}
