/**
 * Tujuan: Registrasi watcher lifecycle untuk sinkronisasi data tab Pengaturan.
 * Caller: usePengaturan facade.
 * Dependensi: Vue watch/onMounted, state activeTab.
 * Main Functions: registerPengaturanWatchers().
 * Side Effects: Trigger loadData saat mount dan saat tab berubah.
 */
import { onMounted, watch } from "vue";
import { activeTab } from "./usePengaturanState";

let isWatcherRegistered = false;

export const registerPengaturanWatchers = (loadData: () => Promise<void>) => {
  if (isWatcherRegistered) return;

  watch(activeTab, () => {
    void loadData();
  });

  onMounted(() => {
    void loadData();
  });

  isWatcherRegistered = true;
};
