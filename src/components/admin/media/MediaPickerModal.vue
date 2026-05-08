<script setup lang="ts">
/**
 * Tujuan:
 * - Modal pemilihan media reusable untuk single/multi select dengan indikator visual selected.
 *
 * Caller:
 * - src/views/admin/GaleriDokumentasi.vue
 *
 * Dependensi:
 * - useMediaPicker
 * - lucide-vue-next
 *
 * Main Functions:
 * - handleOpenChange
 * - handleToggleItem
 * - handleConfirm
 *
 * Side Effects:
 * - Trigger lazy fetch media saat modal dibuka.
 */
import { computed, watch } from "vue";
import { Check, Loader2, RefreshCcw, X } from "lucide-vue-next";
import type { MediaItem } from "../../../services/admin/mediaService";
import { useMediaPicker } from "../../../composables/admin/useMediaPicker";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    multiple?: boolean;
    selected?: MediaItem[];
  }>(),
  {
    title: "Pilih Media",
    multiple: true,
    selected: () => [],
  },
);

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "select", payload: MediaItem[]): void;
}>();

const picker = useMediaPicker({
  multiple: props.multiple,
  initialSelected: props.selected,
});

watch(
  () => props.open,
  async (value) => {
    if (value) {
      picker.setSelected(props.selected);
      await picker.openModal();
      return;
    }
    picker.closeModal();
  },
);

watch(
  () => props.selected,
  (next) => {
    picker.setSelected(next);
  },
  { deep: true },
);

const selectedCount = computed(() => picker.selectedItems.value.length);

function handleOpenChange(value: boolean): void {
  emit("update:open", value);
}

function handleToggleItem(item: MediaItem): void {
  picker.toggleSelect(item);
}

function handleConfirm(): void {
  emit("select", picker.confirmSelection());
  handleOpenChange(false);
}

function handleRefresh(): void {
  void picker.refresh();
}

function imageAlt(item: MediaItem): string {
  return item.alt_text || `Media ${item.id}`;
}

function imageSrc(item: MediaItem): string {
  return item.thumb_url || item.file_url;
}

function handleImageError(event: Event, item: MediaItem): void {
  const target = event.target as HTMLImageElement | null;
  if (!target) return;
  if (target.src.includes(item.file_url)) return;
  target.src = item.file_url;
}
</script>

<template>
  <Transition name="fade-slide">
    <div
      v-if="open"
      class="fixed inset-0 z-[140] flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        @click="handleOpenChange(false)"
      ></div>

      <div
        class="relative w-full max-w-6xl bg-white dark:bg-[#121826] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800"
        >
          <div>
            <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">
              {{ title }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{
                multiple
                  ? "Pilih satu atau lebih media untuk galeri/dokumentasi."
                  : "Pilih satu media."
              }}
            </p>
          </div>

          <button
            type="button"
            class="p-2 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            @click="handleOpenChange(false)"
          >
            <X :size="18" />
          </button>
        </div>

        <div class="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Selected: {{ selectedCount }} item
            </p>
            <button
              type="button"
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-brand-green hover:text-brand-green transition-colors"
              @click="handleRefresh"
            >
              <RefreshCcw :size="14" />
              Refresh
            </button>
          </div>
        </div>

        <div class="p-5 overflow-y-auto">
          <div
            v-if="picker.isLoading.value && !picker.isLoaded.value"
            class="h-56 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-sm text-slate-500"
          >
            <Loader2 class="animate-spin mr-2" :size="18" />
            Memuat media...
          </div>

          <div
            v-else-if="picker.errorMessage.value"
            class="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300"
          >
            {{ picker.errorMessage.value }}
          </div>

          <div
            v-else-if="picker.items.value.length === 0"
            class="h-56 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm text-slate-500"
          >
            Belum ada media tersedia.
          </div>

          <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            <button
              v-for="item in picker.items.value"
              :key="item.id"
              type="button"
              class="group relative overflow-hidden rounded-xl border bg-slate-50 dark:bg-slate-900 transition-all"
              :class="
                picker.selectedIds.value.has(item.id)
                  ? 'border-emerald-500 ring-2 ring-emerald-400/70'
                  : 'border-slate-200 dark:border-slate-700 hover:border-brand-green'
              "
              @click="handleToggleItem(item)"
            >
              <img
                :src="imageSrc(item)"
                :alt="imageAlt(item)"
                loading="lazy"
                decoding="async"
                class="w-full aspect-square object-cover"
                @error="(event) => handleImageError(event, item)"
              />
              <div
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left"
              >
                <p class="text-[11px] text-white truncate">
                  {{ item.alt_text || item.storage_key }}
                </p>
              </div>

              <div
                v-if="picker.selectedIds.value.has(item.id)"
                class="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow"
              >
                <Check :size="14" />
              </div>
            </button>
          </div>
        </div>

        <div
          class="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2"
        >
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            @click="handleOpenChange(false)"
          >
            Batal
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-green text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!picker.hasSelection.value"
            @click="handleConfirm"
          >
            Gunakan {{ selectedCount }} Media
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(10px);
}
</style>
