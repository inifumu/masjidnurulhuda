/**
 * Tujuan: Menangani orchestration modal (open/edit/reset/close) pada fitur Pengaturan.
 * Caller: usePengaturan facade.
 * Dependensi: state dari usePengaturanState.
 * Main Functions: openModal(), closeModal(), toggleDropdown(), closeDropdowns().
 * Side Effects: Mutasi state modal/form/dropdown.
 */
import {
  activeTab,
  editId,
  formData,
  isModalOpen,
  modalMode,
  openDropdown,
  type EditablePengaturanItem,
} from "./usePengaturanState";

export const toggleDropdown = (name: string) => {
  openDropdown.value = openDropdown.value === name ? null : name;
};

export const closeDropdowns = () => {
  openDropdown.value = null;
};

const resetFormForCreate = () => {
  editId.value = null;
  formData.value.nama = "";
  formData.value.jenis_arus = "pemasukan";
  formData.value.nama_pengurus = "";
  formData.value.nama_pengurus_list = [""];
  formData.value.email = "";
  formData.value.password = "";
  formData.value.role = "pengurus";
};

const fillFormForEdit = (item: EditablePengaturanItem) => {
  editId.value = item.id ?? null;

  if (activeTab.value === "kategori") {
    formData.value.nama = item.nama_kategori || item.name || "";
    formData.value.jenis_arus = item.jenis_arus || "pemasukan";
  } else if (activeTab.value === "seksi") {
    formData.value.nama = item.nama_seksi || "";
    formData.value.nama_pengurus = item.nama_pengurus || "";
    formData.value.nama_pengurus_list = item.nama_pengurus
      ? item.nama_pengurus.split(", ")
      : [""];
  } else if (activeTab.value === "akun") {
    formData.value.nama = item.name || "";
    formData.value.email = item.email || "";
    formData.value.role = item.role || "pengurus";
    formData.value.password = "";
  }
};

export const openModal = (
  mode: "add" | "edit",
  item?: EditablePengaturanItem,
) => {
  modalMode.value = mode;
  closeDropdowns();

  if (mode === "edit" && item) {
    fillFormForEdit(item);
  } else {
    resetFormForCreate();
  }

  isModalOpen.value = true;
};

export const closeModal = () => {
  isModalOpen.value = false;
  closeDropdowns();
};
