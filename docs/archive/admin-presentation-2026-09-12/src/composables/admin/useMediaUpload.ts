/**
 * Tujuan:
 * - Composable upload batch Media Library admin dengan status per file.
 *
 * Caller:
 * - View admin media library / media picker.
 *
 * Dependensi:
 * - mediaService
 * - imagePipeline
 * - vue (ref)
 *
 * Main Functions:
 * - addFiles
 * - setItemAltText
 * - uploadAll
 * - retryItem
 * - removeItem
 *
 * Side Effects:
 * - Men-generate preview object URL (direvoke saat item dihapus/reset).
 * - Network I/O upload ke API media admin.
 */

import { ref } from "vue";
import {
  createStorageKeyFromFile,
  processImageFile,
  type ProcessedImageResult,
  type FileProcessError,
} from "../../utils/media/imagePipeline";
import {
  mediaService,
  type MediaItem,
  type MediaUsageCategory,
} from "../../services/admin/mediaService";

type UploadStatus =
  | "queued"
  | "processing"
  | "ready"
  | "uploading"
  | "success"
  | "failed";

export interface MediaUploadQueueItem {
  localId: string;
  sourceFile: File;
  processed?: ProcessedImageResult;
  kategori_penggunaan: MediaUsageCategory;
  alt_text: string;
  status: UploadStatus;
  progress: number;
  errorMessage: string | null;
  uploadedItem: MediaItem | null;
}

function makeLocalId(): string {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Terjadi kesalahan saat memproses/upload media.";
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunkSize = Math.max(1, size);
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export function useMediaUpload() {
  const queue = ref<MediaUploadQueueItem[]>([]);
  const isUploading = ref(false);
  const compressionBatchSize = 2;
  const uploadBatchSize = 2;

  async function processOneItem(
    item: MediaUploadQueueItem,
  ): Promise<MediaUploadQueueItem> {
    item.status = "processing";
    item.progress = Math.max(item.progress, 1);

    try {
      const processed = await processImageFile(item.sourceFile, {
        onProgress: (percent) => {
          const safePercent = Math.max(0, Math.min(100, Math.floor(percent)));
          item.progress = Math.max(item.progress, safePercent);
        },
      });

      item.processed = processed;
      item.status = "ready";
      item.progress = 100;
    } catch (error) {
      const typedError = error as FileProcessError;
      item.status = "failed";
      item.errorMessage = typedError.message || getErrorMessage(error);
      item.progress = 0;
    }

    return item;
  }

  async function addFiles(
    files: File[],
    kategori: MediaUsageCategory = "general",
  ): Promise<void> {
    const draftItems: MediaUploadQueueItem[] = files.map((file) => ({
      localId: makeLocalId(),
      sourceFile: file,
      kategori_penggunaan: kategori,
      alt_text: "",
      status: "queued",
      progress: 0,
      errorMessage: null,
      uploadedItem: null,
    }));

    const startIndex = queue.value.length;
    queue.value.push(...draftItems);

    const reactiveDrafts = queue.value.slice(startIndex);

    const chunks = chunkArray(reactiveDrafts, compressionBatchSize);
    for (const chunk of chunks) {
      await Promise.all(chunk.map((item) => processOneItem(item)));
    }
  }

  async function uploadOne(item: MediaUploadQueueItem): Promise<void> {
    if (!item.processed) {
      item.status = "failed";
      item.errorMessage = "File belum siap upload.";
      return;
    }

    item.status = "uploading";
    item.progress = 0;
    item.errorMessage = null;

    try {
      const storageKey = createStorageKeyFromFile(
        item.sourceFile.name,
        item.processed.extension,
      );

      const uploaded = await mediaService.uploadMedia({
        file: item.processed.processedFile,
        thumb_file: item.processed.thumbFile,
        storage_key: storageKey,
        thumb_storage_key: storageKey.replace(/\.webp$/i, "-thumb.webp"),
        kategori_penggunaan: item.kategori_penggunaan,
        alt_text: item.alt_text,
        width: item.processed.width,
        height: item.processed.height,
      });

      item.uploadedItem = uploaded;
      item.status = "success";
      item.progress = 100;
    } catch (error) {
      item.status = "failed";
      item.errorMessage = getErrorMessage(error);
      item.progress = 0;
    }
  }

  async function uploadAll(): Promise<void> {
    if (isUploading.value) return;
    isUploading.value = true;

    try {
      const readyItems = queue.value.filter(
        (item) => item.status === "ready" || item.status === "failed",
      );

      const chunks = chunkArray(readyItems, uploadBatchSize);
      for (const chunk of chunks) {
        await Promise.all(chunk.map((item) => uploadOne(item)));
      }
    } finally {
      isUploading.value = false;
    }
  }

  function setItemAltText(localId: string, value: string): void {
    const item = queue.value.find((q) => q.localId === localId);
    if (!item) return;
    item.alt_text = value;
  }

  async function retryItem(localId: string): Promise<void> {
    const item = queue.value.find((q) => q.localId === localId);
    if (!item) return;

    if (!item.processed) {
      item.errorMessage = null;
      await processOneItem(item);
      if (!item.processed || item.status === "failed") return;
    }

    await uploadOne(item);
  }

  function removeItem(localId: string): void {
    const index = queue.value.findIndex((q) => q.localId === localId);
    if (index < 0) return;

    const item = queue.value[index];
    if (item.processed?.previewUrl) {
      URL.revokeObjectURL(item.processed.previewUrl);
    }
    if (item.processed?.thumbPreviewUrl) {
      URL.revokeObjectURL(item.processed.thumbPreviewUrl);
    }

    queue.value.splice(index, 1);
  }

  function clearQueue(): void {
    queue.value.forEach((item) => {
      if (item.processed?.previewUrl) {
        URL.revokeObjectURL(item.processed.previewUrl);
      }
      if (item.processed?.thumbPreviewUrl) {
        URL.revokeObjectURL(item.processed.thumbPreviewUrl);
      }
    });
    queue.value = [];
  }

  return {
    queue,
    isUploading,
    addFiles,
    uploadAll,
    setItemAltText,
    retryItem,
    removeItem,
    clearQueue,
  };
}
