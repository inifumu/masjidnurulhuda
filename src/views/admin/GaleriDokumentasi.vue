<script setup lang="ts">
/**
 * Tujuan:
 * - Placeholder manajemen galeri & dokumentasi untuk web utama dengan multi-select media.
 *
 * Caller:
 * - Router `/admin/galeri-dokumentasi` melalui AdminLayout.
 *
 * Dependensi:
 * - MediaPickerModal
 * - mediaService type MediaItem
 *
 * Main Functions:
 * - openPicker
 * - handleSelectedMedia
 * - removeSelected
 *
 * Side Effects:
 * - Menyimpan state pilihan media di memori halaman (belum persist ke backend).
 */
import { computed, ref } from "vue";
import { Images, Plus, Trash2 } from "lucide-vue-next";
import type { MediaItem } from "../../services/admin/mediaService";
import MediaPickerModal from "../../components/admin/media/MediaPickerModal.vue";

const isPickerOpen = ref(false);
const selectedMedia = ref<MediaItem[]>([]);

const selectedCount = computed(() => selectedMedia.value.length);

function openPicker(): void {
  isPickerOpen.value = true;
}

function handleSelectedMedia(items: MediaItem[]): void {
  selectedMedia.value = items;
}

function removeSelected(id: number): void {
  selectedMedia.value = selectedMedia.value.filter((item) => item.id !== id);
}
</script>

<template>
  <div class="space-y-6 pb-20 max-w-7xl mx-auto">
    <div>
      <h2
        class="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2"
      >
        <Images class="text-brand-green" :size="24" /> Galeri & Dokumentasi
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Placeholder pengaturan media untuk konten galeri/dokumentasi website
        utama.
      </p>
    </div>

    <section
      class="bg-white dark:bg-[#121826] rounded-xl border border-slate-200 dark:border-slate-800 p-5 md:p-6"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">
            Media Terpilih
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total: {{ selectedCount }} item
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-green text-white text-sm font-semibold hover:bg-emerald-700"
          @click="openPicker"
        >
          <Plus :size="16" />
          Pilih Media
        </button>
      </div>

      <div
        v-if="selectedMedia.length === 0"
        class="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-8 text-center"
      >
        <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
          Belum ada media dipilih.
        </p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Klik “Pilih Media” untuk menambahkan item galeri/dokumentasi.
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
      >
        <article
          v-for="item in selectedMedia"
          :key="item.id"
          class="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <img
            :src="item.file_url"
            :alt="item.alt_text || `Media ${item.id}`"
            class="w-full aspect-square object-cover"
            loading="lazy"
            decoding="async"
          />
          <div
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2"
          >
            <p class="text-[11px] text-white truncate">
              {{ item.alt_text || item.storage_key }}
            </p>
          </div>

          <button
            type="button"
            class="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            @click="removeSelected(item.id)"
          >
            <Trash2 :size="14" />
          </button>
        </article>
      </div>
    </section>

    <MediaPickerModal
      v-model:open="isPickerOpen"
      title="Pilih Media Galeri & Dokumentasi"
      :multiple="true"
      :selected="selectedMedia"
      @select="handleSelectedMedia"
    />
  </div>
</template>
