/**
 * Tujuan:
 * - Composable picker media reusable (single/multi select) dengan lazy fetch saat modal dibuka.
 *
 * Caller:
 * - src/components/admin/media/MediaPickerModal.vue
 * - view admin yang butuh pemilihan aset media.
 *
 * Dependensi:
 * - Vue reactivity
 * - mediaService
 *
 * Main Functions:
 * - openModal
 * - closeModal
 * - toggleSelect
 * - confirmSelection
 *
 * Side Effects:
 * - Network I/O list media ke API admin saat openModal pertama kali / refresh manual.
 */
import { computed, ref } from "vue";
import {
  mediaService,
  type ListMediaParams,
  type MediaItem,
} from "../../services/admin/mediaService";

interface UseMediaPickerOptions {
  multiple?: boolean;
  initialSelected?: MediaItem[];
  query?: ListMediaParams;
}

export function useMediaPicker(options: UseMediaPickerOptions = {}) {
  const isOpen = ref(false);
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const errorMessage = ref("");

  const items = ref<MediaItem[]>([]);
  const selectedMap = ref<Map<number, MediaItem>>(new Map());
  const query = ref<ListMediaParams>({
    page: 1,
    limit: 60,
    ...(options.query ?? {}),
  });

  if (options.initialSelected?.length) {
    options.initialSelected.forEach((item) => {
      selectedMap.value.set(item.id, item);
    });
  }

  const isMultiple = computed(() => options.multiple !== false);
  const selectedItems = computed(() => Array.from(selectedMap.value.values()));
  const selectedIds = computed(() => new Set(selectedMap.value.keys()));
  const hasSelection = computed(() => selectedMap.value.size > 0);

  async function loadMedia(force = false): Promise<void> {
    if (isLoading.value) return;
    if (!force && isLoaded.value) return;

    isLoading.value = true;
    errorMessage.value = "";

    try {
      const response = await mediaService.listMedia(query.value);
      items.value = response.items;
      isLoaded.value = true;
    } catch (error) {
      console.error(error);
      errorMessage.value = "Gagal memuat daftar media.";
    } finally {
      isLoading.value = false;
    }
  }

  async function openModal(): Promise<void> {
    isOpen.value = true;
    await loadMedia(false);
  }

  function closeModal(): void {
    isOpen.value = false;
  }

  function setSelected(itemsToSet: MediaItem[]): void {
    const next = new Map<number, MediaItem>();
    itemsToSet.forEach((item) => next.set(item.id, item));
    selectedMap.value = next;
  }

  function clearSelection(): void {
    selectedMap.value = new Map();
  }

  function toggleSelect(item: MediaItem): void {
    const next = new Map(selectedMap.value);

    if (next.has(item.id)) {
      next.delete(item.id);
      selectedMap.value = next;
      return;
    }

    if (!isMultiple.value) {
      selectedMap.value = new Map([[item.id, item]]);
      return;
    }

    next.set(item.id, item);
    selectedMap.value = next;
  }

  function confirmSelection(): MediaItem[] {
    return selectedItems.value;
  }

  async function refresh(): Promise<void> {
    await loadMedia(true);
  }

  return {
    isOpen,
    isLoading,
    isLoaded,
    errorMessage,
    items,
    isMultiple,
    selectedItems,
    selectedIds,
    hasSelection,
    openModal,
    closeModal,
    toggleSelect,
    setSelected,
    clearSelection,
    confirmSelection,
    refresh,
  };
}
