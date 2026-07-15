/**
 * Tujuan: Menyediakan aksi utama untuk fetch/save/delete data Pengaturan.
 * Caller: usePengaturan facade dan watcher pengaturan.
 * Dependensi: pengaturanService, authStore, state dari usePengaturanState, vue-sonner.
 * Main Functions: loadData, saveItem, deleteItem, helper dropdown, helper form list pengurus.
 * Side Effects: Network request API, toast notifikasi, mutasi state global pengaturan.
 */
import { toast } from "vue-sonner";
import {
  pengaturanService,
  type PengaturanFormState,
} from "../../../services/admin/pengaturanService";
import { useAuthStore } from "../../../stores/authStore";
import {
  activeTab,
  akunList,
  editId,
  errorMessage,
  formData,
  isLoading,
  kategoriList,
  seksiList,
} from "./usePengaturanState";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Terjadi kesalahan";

const mapFormState = (): PengaturanFormState => ({
  nama: formData.value.nama,
  jenis_arus: formData.value.jenis_arus,
  nama_pengurus_list: [...formData.value.nama_pengurus_list],
  role: formData.value.role,
  email: formData.value.email,
  password: formData.value.password,
});

export const loadData = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const data = await pengaturanService.loadByTab(activeTab.value);

    if ("kategori" in data) {
      kategoriList.value = data.kategori ?? [];
    } else if ("seksi" in data) {
      seksiList.value = data.seksi ?? [];
    } else if ("akun" in data) {
      akunList.value = data.akun ?? [];
    }
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    errorMessage.value = message;
    toast.error(message);
  } finally {
    isLoading.value = false;
  }
};

export const addPengurusInput = () =>
  formData.value.nama_pengurus_list.push("");

export const removePengurusInput = (index: number) =>
  formData.value.nama_pengurus_list.splice(index, 1);

export const saveItem = async () => {
  isLoading.value = true;
  const authStore = useAuthStore();

  try {
    const activeTabAtSave = activeTab.value;
    const editIdAtSave = editId.value;

    const { shouldWarnRelogin } = await pengaturanService.saveByTab({
      tab: activeTabAtSave,
      editId: editIdAtSave,
      form: mapFormState(),
    });

    await loadData();
    toast.success("Data berhasil disimpan!");

    if (
      activeTabAtSave === "akun" &&
      shouldWarnRelogin &&
      editIdAtSave === authStore.user?.id
    ) {
      toast.warning(
        "Profil/Role Anda diubah! Silakan Logout dan Login kembali.",
      );
    }
  } catch (error: unknown) {
    toast.error(getErrorMessage(error));
  } finally {
    isLoading.value = false;
  }
};

export const deleteItem = async (id: number) => {
  isLoading.value = true;
  try {
    await pengaturanService.deleteByTab(activeTab.value, id);
    await loadData();
    toast.success(activeTab.value === "akun" ? "Akun berhasil dinonaktifkan!" : "Data berhasil dihapus!");
  } catch (error: unknown) {
    toast.error(getErrorMessage(error));
  } finally {
    isLoading.value = false;
  }
};
