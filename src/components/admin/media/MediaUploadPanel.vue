<script setup lang="ts">
/**
 * Tujuan:
 * - Panel upload media admin (drag-drop + multi upload) yang konsisten dengan tema admin.
 *
 * Caller:
 * - src/views/admin/MediaLibrary.vue
 *
 * Dependensi:
 * - useMediaUpload composable
 * - lucide-vue-next icons
 *
 * Main Functions:
 * - handleFileInput
 * - handleDrop
 * - handleUploadAll
 * - statusLabel
 *
 * Side Effects:
 * - Menambahkan file ke queue upload, memproses kompresi, dan upload ke API media.
 */
import { computed, ref, onMounted, onUnmounted } from "vue";
import type { MediaItem } from "../../../services/admin/mediaService";
import {
  UploadCloud,
  RefreshCcw,
  Trash2,
  Loader2,
  ChevronDown,
  ImagePlus,
  CheckCircle2,
  XCircle,
  FileImage,
} from "lucide-vue-next";
import {
  useMediaUpload,
  type MediaUploadQueueItem,
} from "../../../composables/admin/useMediaUpload";
import type { MediaUsageCategory } from "../../../services/admin/mediaService";

const emit = defineEmits<{
  (event: "uploaded", payload: MediaItem): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const selectedCategory = ref<MediaUsageCategory>("general");

// State untuk custom dropdown
const openDropdown = ref<string | null>(null);
const toggleDropdown = (name: string) => {
  openDropdown.value = openDropdown.value === name ? null : name;
};
const closeDropdown = () => {
  openDropdown.value = null;
};

// Event listener untuk menutup dropdown saat klik di luar
onMounted(() => document.addEventListener("click", closeDropdown));
onUnmounted(() => document.removeEventListener("click", closeDropdown));

const {
  queue,
  isUploading,
  addFiles,
  uploadAll,
  setItemAltText,
  retryItem,
  removeItem,
  clearQueue,
} = useMediaUpload();

const categoryOptions: Array<{ value: MediaUsageCategory; label: string }> = [
  { value: "general", label: "General (Umum)" },
  { value: "artikel", label: "Cover Artikel" },
  { value: "profil", label: "Foto Profil" },
  { value: "galeri", label: "Galeri Masjid" },
];

const hasReadyItems = computed(() =>
  queue.value.some(
    (item) => item.status === "ready" || item.status === "failed",
  ),
);

const successCount = computed(
  () => queue.value.filter((item) => item.status === "success").length,
);

function openFilePicker(): void {
  fileInputRef.value?.click();
}

async function appendFiles(fileList: FileList | null): Promise<void> {
  if (!fileList || fileList.length === 0) return;
  const files = Array.from(fileList);
  await addFiles(files, selectedCategory.value);
}

async function handleFileInput(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  await appendFiles(input.files);
  input.value = "";
}

async function handleDrop(event: DragEvent): Promise<void> {
  event.preventDefault();
  isDragOver.value = false;
  await appendFiles(event.dataTransfer?.files ?? null);
}

function statusLabel(item: MediaUploadQueueItem): string {
  if (item.status === "processing") return "Kompresi...";
  if (item.status === "uploading") return "Mengunggah...";
  if (item.status === "success") return "Sukses";
  if (item.status === "failed") return "Gagal";
  if (item.status === "ready") return "Siap";
  return "Menunggu";
}

function phaseLabel(item: MediaUploadQueueItem): string {
  if (item.status === "processing") return "Fase 1 • Kompresi berjalan";
  if (item.status === "ready") return "Fase 1 • Kompresi selesai, siap upload";
  if (item.status === "uploading") return "Fase 2 • Upload ke server berjalan";
  if (item.status === "success") return "Fase 2 • Upload selesai";
  if (item.status === "failed") return "Perlu tindakan • Coba ulang";
  return "Menunggu proses kompresi";
}

async function handleUploadAll(): Promise<void> {
  if (isUploading.value) return;

  const uploadedBefore = new Set(
    queue.value
      .map((item) => item.uploadedItem?.id)
      .filter((id): id is number => typeof id === "number"),
  );

  await uploadAll();

  queue.value.forEach((item) => {
    const uploadedItem = item.uploadedItem;
    if (!uploadedItem) return;
    if (uploadedBefore.has(uploadedItem.id)) return;
    emit("uploaded", uploadedItem);
  });
}
</script>

<template>
  <section class="max-w-3xl mx-auto py-4">
    <!-- Header Box ala FormProposal -->
    <div
      class="mb-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex gap-3"
    >
      <ImagePlus :size="24" class="text-slate-500 flex-shrink-0" />
      <div>
        <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">
          Gudang Dokumentasi Media
        </h4>
        <p class="text-xs text-slate-500 mt-1">
          Upload aset gambar ke penyimpanan Cloudflare R2 (otomatis dikompresi
          ke WebP).
        </p>
      </div>
    </div>

    <!-- Kontrol Form -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="relative" @click.stop>
        <label
          class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1"
        >
          Kategori Penggunaan
        </label>
        <div
          @click="toggleDropdown('kategori')"
          class="flex items-center justify-between px-3 py-2.5 border rounded-lg bg-white dark:bg-[#0e131f] cursor-pointer transition-colors border-slate-200 dark:border-slate-700 hover:border-brand-green"
        >
          <span class="text-sm font-medium text-slate-800 dark:text-white">
            {{
              categoryOptions.find((c) => c.value === selectedCategory)
                ?.label || "Pilih Kategori"
            }}
          </span>
          <ChevronDown
            :size="14"
            class="text-slate-400 transition-transform"
            :class="
              openDropdown === 'kategori' ? 'rotate-180 text-brand-green' : ''
            "
          />
        </div>
        <Transition name="fade-slide">
          <div
            v-if="openDropdown === 'kategori'"
            class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 overflow-hidden"
          >
            <div
              v-for="opt in categoryOptions"
              :key="opt.value"
              @click="
                selectedCategory = opt.value;
                toggleDropdown('kategori');
              "
              class="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm font-medium transition-colors"
              :class="
                selectedCategory === opt.value
                  ? 'text-brand-green bg-brand-green/5'
                  : 'text-slate-700 dark:text-slate-300'
              "
            >
              {{ opt.label }}
            </div>
          </div>
        </Transition>
      </div>

      <div class="flex items-end gap-2">
        <button
          type="button"
          @click="openFilePicker"
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e131f] text-slate-700 dark:text-slate-300 text-sm font-bold hover:border-brand-green hover:text-brand-green transition-all"
        >
          <UploadCloud :size="16" /> Tambah File
        </button>
        <button
          v-if="queue.length > 0"
          type="button"
          @click="clearQueue"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
        >
          <Trash2 :size="16" /> Reset
        </button>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="handleFileInput"
    />

    <!-- Dropzone Area -->
    <div
      v-if="queue.length === 0"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop="handleDrop"
      @click="openFilePicker"
      class="border-2 border-dashed rounded-xl px-5 py-12 text-center transition-all cursor-pointer group"
      :class="
        isDragOver
          ? 'border-brand-green bg-brand-green/5 scale-[1.02]'
          : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0e131f] hover:bg-slate-50 dark:hover:bg-slate-800/50'
      "
    >
      <div
        class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-brand-green group-hover:bg-brand-green/10 transition-colors mb-4"
      >
        <UploadCloud :size="28" />
      </div>
      <p class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
        Tarik & Lepas gambar di sini
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Mendukung JPG, PNG, WEBP. Bisa pilih banyak file sekaligus.
      </p>
    </div>

    <!-- Daftar Antrean Upload -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <span class="text-[10px] font-bold text-slate-400 uppercase">
          Daftar Antrean ({{ queue.length }})
        </span>
        <span
          v-if="successCount > 0"
          class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1"
        >
          <CheckCircle2 :size="12" /> {{ successCount }} Berhasil
        </span>
      </div>

      <div class="space-y-2">
        <div
          v-for="item in queue"
          :key="item.localId"
          class="relative overflow-hidden border rounded-xl bg-white dark:bg-[#0e131f] transition-colors"
          :class="{
            'border-rose-300 dark:border-rose-900': item.status === 'failed',
            'border-emerald-300 dark:border-emerald-900':
              item.status === 'success',
            'border-slate-200 dark:border-slate-700': ![
              'failed',
              'success',
            ].includes(item.status),
          }"
        >
          <!-- Background Progress Bar Tipis di bawah item -->
          <div
            v-if="item.status !== 'success' && item.status !== 'failed'"
            class="absolute bottom-0 left-0 h-1 bg-brand-green transition-all duration-300 ease-out"
            :style="{ width: `${item.progress}%` }"
          ></div>

          <div class="p-3.5 flex items-center gap-3">
            <!-- Icon/Thumbnail Placeholder -->
            <div
              class="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center"
              :class="{
                'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30':
                  item.status === 'success',
                'bg-rose-100 text-rose-600 dark:bg-rose-900/30':
                  item.status === 'failed',
                'bg-slate-100 text-slate-400 dark:bg-slate-800': ![
                  'failed',
                  'success',
                ].includes(item.status),
              }"
            >
              <CheckCircle2 v-if="item.status === 'success'" :size="20" />
              <XCircle v-else-if="item.status === 'failed'" :size="20" />
              <FileImage v-else :size="20" />
            </div>

            <!-- Detail Info -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-bold text-slate-700 dark:text-slate-200 truncate"
              >
                {{ item.sourceFile.name }}
              </p>
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  class="text-[10px] font-bold uppercase tracking-wider"
                  :class="{
                    'text-emerald-600 dark:text-emerald-400':
                      item.status === 'success',
                    'text-rose-500 dark:text-rose-400':
                      item.status === 'failed',
                    'text-brand-green animate-pulse': [
                      'processing',
                      'uploading',
                    ].includes(item.status),
                    'text-slate-400':
                      item.status === 'ready' || item.status === 'queued',
                  }"
                >
                  {{ statusLabel(item) }}
                  <span
                    v-if="['processing', 'uploading'].includes(item.status)"
                  >
                    {{ item.progress }}%
                  </span>
                </span>
                <span
                  v-if="item.errorMessage"
                  class="text-[10px] text-rose-500 truncate"
                >
                  • {{ item.errorMessage }}
                </span>
              </div>
              <p
                class="text-[10px] mt-1"
                :class="{
                  'text-emerald-600 dark:text-emerald-400':
                    item.status === 'success',
                  'text-rose-500 dark:text-rose-400': item.status === 'failed',
                  'text-brand-green': ['processing', 'uploading'].includes(
                    item.status,
                  ),
                  'text-slate-400':
                    item.status === 'ready' || item.status === 'queued',
                }"
              >
                {{ phaseLabel(item) }}
              </p>

              <div class="mt-2">
                <label
                  class="block text-[10px] font-semibold uppercase text-slate-400 mb-1"
                >
                  Alt Text
                </label>
                <input
                  type="text"
                  :value="item.alt_text"
                  :disabled="
                    item.status === 'success' || item.status === 'uploading'
                  "
                  maxlength="160"
                  placeholder="Deskripsi singkat gambar (opsional)"
                  class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green/40 disabled:opacity-60"
                  @input="
                    setItemAltText(
                      item.localId,
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
              </div>
            </div>

            <!-- Tombol Aksi Item -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                v-if="item.status === 'failed'"
                @click="retryItem(item.localId)"
                class="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 transition-colors"
                title="Coba Lagi"
              >
                <RefreshCcw :size="16" />
              </button>
              <button
                v-if="item.status !== 'success'"
                @click="removeItem(item.localId)"
                class="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                title="Hapus dari antrean"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tombol Eksekusi Utama (Ala FormProposal) -->
      <button
        type="button"
        @click="handleUploadAll"
        :disabled="!hasReadyItems || isUploading"
        class="w-full flex items-center justify-center gap-2 mt-2 py-3.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="isUploading" :size="18" class="animate-spin" />
        <UploadCloud v-else :size="18" />
        {{ isUploading ? "Sedang Memproses Upload..." : "Mulai Upload Semua" }}
      </button>
    </div>
  </section>
</template>
