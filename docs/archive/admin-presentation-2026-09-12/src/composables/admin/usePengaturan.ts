/**
 * Tujuan: Facade composable Pengaturan agar kontrak API ke view tetap stabil.
 * Caller: src/views/admin/Pengaturan.vue
 * Dependensi: modul pengaturan (state/actions/modal/watchers), authStore.
 * Main Functions: usePengaturan() menggabungkan state + actions + modal orchestration.
 * Side Effects: Registrasi watcher mount/tab-change untuk auto load data.
 */
import { useAuthStore } from "../../stores/authStore";
import {
  addPengurusInput,
  deleteItem,
  loadData,
  removePengurusInput,
  saveItem,
} from "./pengaturan/usePengaturanActions";
import {
  closeModal,
  closeDropdowns,
  openModal,
  toggleDropdown,
} from "./pengaturan/usePengaturanModal";
import {
  activeTab,
  akunList,
  errorMessage,
  formData,
  isLoading,
  isModalOpen,
  kategoriList,
  modalMode,
  openDropdown,
  seksiList,
} from "./pengaturan/usePengaturanState";
import { registerPengaturanWatchers } from "./pengaturan/usePengaturanWatchers";

export function usePengaturan() {
  const authStore = useAuthStore();

  registerPengaturanWatchers(loadData);

  const saveItemWithModalClose = async () => {
    await saveItem();
    closeModal();
  };

  return {
    authStore,
    activeTab,
    isLoading,
    errorMessage,
    kategoriList,
    seksiList,
    akunList,
    isModalOpen,
    modalMode,
    formData,
    openDropdown,
    toggleDropdown,
    closeDropdowns,
    openModal,
    closeModal,
    saveItem: saveItemWithModalClose,
    deleteItem,
    addPengurusInput,
    removePengurusInput,
  };
}
