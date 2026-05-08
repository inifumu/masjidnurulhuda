<script setup lang="ts">
/**
 * Tujuan:
 * - Halaman Media Library admin: upload, listing, copy URL, dan delete media.
 *
 * Caller:
 * - Router `/admin/media` melalui AdminLayout.
 *
 * Dependensi:
 * - MediaUploadPanel
 * - ConfirmModal
 * - mediaService
 * - vue-sonner
 *
 * Main Functions:
 * - loadMedia
 * - handleLoadMore
 * - handleCopyUrl
 * - confirmDelete
 * - executeDelete
 * - handleUploaded
 *
 * Side Effects:
 * - Network I/O list/delete media.
 * - Clipboard write saat copy URL.
 */
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import {
  Check,
  Copy,
  ImageOff,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import MediaUploadPanel from "../../components/admin/media/MediaUploadPanel.vue";
import ConfirmModal from "../../components/ui/ConfirmModal.vue";
import {
  mediaService,
  type MediaItem,
} from "../../services/admin/mediaService";

const mediaItems = ref<MediaItem[]>([]);
const brokenImageIds = ref<Set<number>>(new Set());
const loadedImageIds = ref<Set<number>>(new Set());
const failedThumbImageIds = ref<Set<number>>(new Set());
const editingAltId = ref<number | null>(null);
const altDraft = ref("");
const savingAltIds = ref<Set<number>>(new Set());
const page = ref(1);
const limit = 12;
const total = ref(0);
const isLoading = ref(false);
const isLoadingMore = ref(false);

const isDeleteModalOpen = ref(false);
const mediaToDelete = ref<MediaItem | null>(null);
const isDeleting = ref(false);

const isPreviewModalOpen = ref(false);
const previewMedia = ref<MediaItem | null>(null);

const hasMore = computed(() => mediaItems.value.length < total.value);
const altInputRefs = ref<Record<number, HTMLInputElement | null>>({});

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value >= 10 || idx === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[idx]}`;
}

function resolveAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, window.location.origin).toString();
}

async function loadMedia(
  targetPage = 1,
  mode: "replace" | "append" = "replace",
) {
  if (mode === "replace") {
    isLoading.value = true;
  } else {
    isLoadingMore.value = true;
  }

  try {
    const response = await mediaService.listMedia({ page: targetPage, limit });
    total.value = response.total;
    page.value = response.page;

    if (mode === "append") {
      mediaItems.value = [...mediaItems.value, ...response.items];
    } else {
      mediaItems.value = response.items;
    }
  } catch (error) {
    console.error(error);
    toast.error("Gagal memuat daftar media.");
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
}

async function handleLoadMore(): Promise<void> {
  if (isLoadingMore.value || !hasMore.value) return;
  await loadMedia(page.value + 1, "append");
}

async function handleCopyUrl(item: MediaItem): Promise<void> {
  try {
    const absoluteUrl = resolveAbsoluteUrl(item.file_url);
    await navigator.clipboard.writeText(absoluteUrl);
    toast.success("URL media berhasil disalin.");
  } catch (error) {
    console.error(error);
    toast.error("Gagal menyalin URL media.");
  }
}

function openPreview(item: MediaItem): void {
  previewMedia.value = item;
  isPreviewModalOpen.value = true;
}

function closePreview(): void {
  isPreviewModalOpen.value = false;
  previewMedia.value = null;
}

function handlePreviewKeydown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  if (!isPreviewModalOpen.value) return;
  closePreview();
}

function confirmDelete(item: MediaItem): void {
  mediaToDelete.value = item;
  isDeleteModalOpen.value = true;
}

async function executeDelete(): Promise<void> {
  if (!mediaToDelete.value || isDeleting.value) return;

  isDeleting.value = true;
  try {
    await mediaService.deleteMedia(mediaToDelete.value.id);
    mediaItems.value = mediaItems.value.filter(
      (m) => m.id !== mediaToDelete.value?.id,
    );
    total.value = Math.max(0, total.value - 1);
    toast.success("Media berhasil dihapus.");
  } catch (error) {
    console.error(error);
    toast.error("Gagal menghapus media.");
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
    mediaToDelete.value = null;
  }
}

function handleUploaded(item: MediaItem): void {
  brokenImageIds.value.delete(item.id);
  mediaItems.value = [item, ...mediaItems.value];
  total.value += 1;
}

function markImageBroken(item: MediaItem): void {
  if (item.thumb_url && !failedThumbImageIds.value.has(item.id)) {
    failedThumbImageIds.value.add(item.id);
    return;
  }

  brokenImageIds.value.add(item.id);
}

function handleImageLoad(id: number): void {
  loadedImageIds.value.add(id);
  brokenImageIds.value.delete(id);
}

function getDisplayImageSrc(item: MediaItem): string {
  const target =
    item.thumb_url && !failedThumbImageIds.value.has(item.id)
      ? item.thumb_url
      : item.file_url;
  return resolveAbsoluteUrl(target);
}

function startEditAlt(item: MediaItem): void {
  editingAltId.value = item.id;
  altDraft.value = item.alt_text ?? "";

  nextTick(() => {
    altInputRefs.value[item.id]?.focus();
    altInputRefs.value[item.id]?.select();
  });
}

function cancelEditAlt(id: number): void {
  if (editingAltId.value !== id) return;
  editingAltId.value = null;
  altDraft.value = "";
}

function isEditingAlt(id: number): boolean {
  return editingAltId.value === id;
}

async function saveAltText(item: MediaItem): Promise<void> {
  if (savingAltIds.value.has(item.id)) return;

  savingAltIds.value.add(item.id);
  try {
    const updated = await mediaService.updateMediaMetadata(item.id, {
      alt_text: altDraft.value,
    });

    mediaItems.value = mediaItems.value.map((m) =>
      m.id === item.id ? updated : m,
    );
    if (editingAltId.value === item.id) {
      editingAltId.value = null;
      altDraft.value = "";
    }
    toast.success("Alt text berhasil diperbarui.");
  } catch (error) {
    console.error(error);
    toast.error("Gagal memperbarui alt text.");
  } finally {
    savingAltIds.value.delete(item.id);
  }
}

onMounted(async () => {
  window.addEventListener("keydown", handlePreviewKeydown);
  await loadMedia(1, "replace");
});

onUnmounted(() => {
  window.removeEventListener("keydown", handlePreviewKeydown);
  brokenImageIds.value.clear();
  loadedImageIds.value.clear();
  failedThumbImageIds.value.clear();
});
</script>

<template>
  <div class="space-y-6 pb-20 max-w-7xl mx-auto">
    <ConfirmModal
      :isOpen="isDeleteModalOpen"
      @close="isDeleteModalOpen = false"
      @confirm="executeDelete"
      title="Hapus Media?"
      :message="`File akan dihapus permanen dari library. Lanjutkan hapus ${mediaToDelete?.storage_key ?? 'media ini'}?`"
      type="danger"
      :confirmText="isDeleting ? 'Menghapus...' : 'Ya, Hapus Media'"
    />

    <header>
      <h2 class="text-xl font-semibold text-slate-800 dark:text-white">
        Media Library
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Kelola aset gambar untuk artikel, profil, dan galeri masjid.
      </p>
    </header>

    <teleport to="body">
      <div
        v-if="isPreviewModalOpen && previewMedia"
        class="fixed inset-0 z-[90] bg-black/80 p-4 sm:p-6 md:p-10 flex items-center justify-center"
        @click.self="closePreview"
      >
        <button
          type="button"
          class="absolute top-4 right-4 inline-flex items-center justify-center rounded-full bg-black/50 text-white p-2 hover:bg-black/70"
          @click="closePreview"
          aria-label="Tutup preview"
        >
          <X :size="18" />
        </button>

        <img
          :src="resolveAbsoluteUrl(previewMedia.file_url)"
          :alt="previewMedia.alt_text || `Preview media ${previewMedia.id}`"
          class="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
          loading="eager"
          decoding="async"
        />
      </div>
    </teleport>

    <MediaUploadPanel @uploaded="handleUploaded" />

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Daftar Media ({{ mediaItems.length }}/{{ total }})
        </h3>
      </div>

      <div
        v-if="isLoading"
        class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e131f] p-8 flex items-center justify-center text-slate-500 dark:text-slate-400"
      >
        <Loader2 class="animate-spin mr-2" :size="18" /> Memuat media...
      </div>

      <div
        v-else-if="mediaItems.length === 0"
        class="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-8 text-center"
      >
        <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
          Belum ada media.
        </p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload gambar pertama untuk mulai mengisi library.
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <article
          v-for="item in mediaItems"
          :key="item.id"
          class="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e131f]"
        >
          <div
            class="aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-zoom-in"
            @click="openPreview(item)"
          >
            <img
              v-if="!brokenImageIds.has(item.id)"
              :src="getDisplayImageSrc(item)"
              :alt="item.alt_text || `Media ${item.id}`"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover"
              @load="handleImageLoad(item.id)"
              @error="markImageBroken(item)"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-slate-400"
            >
              <ImageOff :size="20" />
            </div>
          </div>

          <div class="p-3 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {{ item.kategori_penggunaan }}
              </span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">{{
                formatBytes(item.size_bytes)
              }}</span>
            </div>

            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              {{ new Date(item.created_at).toLocaleString("id-ID") }}
            </p>

            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="flex-1 inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-green hover:text-brand-green"
                  @click="handleCopyUrl(item)"
                >
                  <Copy :size="14" /> Copy URL
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  @click="confirmDelete(item)"
                >
                  <Trash2 :size="14" />
                </button>
              </div>

              <div
                class="rounded-lg border border-slate-200 dark:border-slate-700 p-2"
              >
                <label
                  class="block text-[10px] font-semibold text-slate-400 uppercase mb-1"
                >
                  Alt Text
                </label>
                <div v-if="isEditingAlt(item.id)" class="space-y-2">
                  <input
                    :ref="
                      (el) =>
                        (altInputRefs[item.id] = el as HTMLInputElement | null)
                    "
                    type="text"
                    v-model="altDraft"
                    maxlength="160"
                    class="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs focus:outline-none focus:border-brand-green"
                    @keyup.enter="saveAltText(item)"
                    @keyup.esc="cancelEditAlt(item.id)"
                  />
                  <div class="flex items-center gap-1.5">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white disabled:opacity-60"
                      :disabled="savingAltIds.has(item.id)"
                      @click="saveAltText(item)"
                    >
                      <Check :size="12" /> Simpan
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold border border-slate-300 dark:border-slate-600"
                      :disabled="savingAltIds.has(item.id)"
                      @click="cancelEditAlt(item.id)"
                    >
                      <X :size="12" /> Batal
                    </button>
                  </div>
                </div>
                <div
                  v-else
                  class="relative z-10 flex items-center justify-between gap-2 pointer-events-auto"
                >
                  <p
                    class="text-xs text-slate-600 dark:text-slate-300 truncate"
                  >
                    {{ item.alt_text || "Belum ada alt text" }}
                  </p>
                  <button
                    type="button"
                    class="relative z-20 pointer-events-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-brand-green hover:bg-brand-green/10 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                    @pointerdown.stop.prevent="startEditAlt(item)"
                    @keydown.enter.prevent="startEditAlt(item)"
                    @keydown.space.prevent="startEditAlt(item)"
                  >
                    <Pencil :size="12" /> Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-if="mediaItems.length > 0" class="flex justify-center pt-2">
        <button
          v-if="hasMore"
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e131f] text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-brand-green hover:text-brand-green disabled:opacity-60"
          :disabled="isLoadingMore"
          @click="handleLoadMore"
        >
          <Loader2 v-if="isLoadingMore" class="animate-spin" :size="16" />
          {{ isLoadingMore ? "Memuat..." : "Load More" }}
        </button>
      </div>
    </section>
  </div>
</template>
