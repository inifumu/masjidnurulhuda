import { ref, watch, onMounted } from "vue";
import { useAuthStore } from "../../stores/authStore";
import { toast } from "vue-sonner";
import {
  pengaturanService,
  type JenisArus,
  type KategoriItem,
  type SeksiItem,
  type UserItem,
  type UserRole,
} from "../../services/admin/pengaturanService";

interface PengaturanForm {
  nama: string;
  jenis_arus: JenisArus;
  nama_pengurus: string;
  nama_pengurus_list: string[];
  role: UserRole;
  email: string;
  password: string;
}

type EditablePengaturanItem = Partial<KategoriItem & SeksiItem & UserItem>;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Terjadi kesalahan";

export function usePengaturan() {
  const authStore = useAuthStore();

  // State Navigasi
  const activeTab = ref<"kategori" | "seksi" | "akun">("kategori");
  const isLoading = ref(false);
  const errorMessage = ref("");

  // State Data
  const kategoriList = ref<KategoriItem[]>([]);
  const seksiList = ref<SeksiItem[]>([]);
  const akunList = ref<UserItem[]>([]);

  // State Modal Form
  const isModalOpen = ref(false);
  const modalMode = ref<"add" | "edit">("add");
  const editId = ref<number | null>(null);

  // State Dropdown Custom
  const openDropdown = ref<string | null>(null);
  const toggleDropdown = (name: string) => {
    openDropdown.value = openDropdown.value === name ? null : name;
  };
  const closeDropdowns = () => {
    openDropdown.value = null;
  };

  // Form Data
  const formData = ref<PengaturanForm>({
    nama: "",
    jenis_arus: "pemasukan",
    nama_pengurus: "",
    nama_pengurus_list: [""],
    role: "pengurus",
    email: "",
    password: "",
  });

  // --- FUNGSI FETCH DATA ---
  const loadData = async () => {
    isLoading.value = true;
    errorMessage.value = "";
    try {
      if (activeTab.value === "kategori") {
        kategoriList.value = await pengaturanService.getKategori();
      } else if (activeTab.value === "seksi") {
        seksiList.value = await pengaturanService.getSeksi();
      } else if (activeTab.value === "akun") {
        akunList.value = await pengaturanService.getUsers();
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      errorMessage.value = message;
      toast.error(message);
    } finally {
      isLoading.value = false;
    }
  };

  watch(activeTab, () => loadData());
  onMounted(() => loadData());

  const addPengurusInput = () => formData.value.nama_pengurus_list.push("");
  const removePengurusInput = (index: number) =>
    formData.value.nama_pengurus_list.splice(index, 1);

  const openModal = (mode: "add" | "edit", item?: EditablePengaturanItem) => {
    modalMode.value = mode;
    errorMessage.value = "";
    closeDropdowns();

    if (mode === "edit" && item) {
      editId.value = item.id ?? null;
      if (activeTab.value === "kategori") {
        formData.value.nama = item.nama_kategori || item.name || "";
        formData.value.jenis_arus = item.jenis_arus || "pemasukan";
      } else if (activeTab.value === "seksi") {
        formData.value.nama = item.nama_seksi || "";
        formData.value.nama_pengurus_list = item.nama_pengurus
          ? item.nama_pengurus.split(", ")
          : [""];
      } else if (activeTab.value === "akun") {
        formData.value.nama = item.name || "";
        formData.value.email = item.email || "";
        formData.value.role = item.role || "pengurus";
        formData.value.password = "";
      }
    } else {
      editId.value = null;
      formData.value.nama = "";
      formData.value.jenis_arus = "pemasukan";
      formData.value.nama_pengurus_list = [""];
      formData.value.email = "";
      formData.value.password = "";
      formData.value.role = "pengurus";
    }
    isModalOpen.value = true;
  };

  const closeModal = () => {
    isModalOpen.value = false;
    closeDropdowns();
  };

  const saveItem = async () => {
    isLoading.value = true;
    try {
      if (activeTab.value === "kategori") {
        if (!formData.value.nama) throw new Error("Nama kategori wajib diisi");
        const payload = {
          nama_kategori: formData.value.nama,
          jenis_arus: formData.value.jenis_arus,
        };
        if (modalMode.value === "add")
          await pengaturanService.addKategori(payload);
        else await pengaturanService.updateKategori(editId.value!, payload);
      } else if (activeTab.value === "seksi") {
        if (!formData.value.nama) throw new Error("Nama seksi wajib diisi");
        const gabunganPengurus = formData.value.nama_pengurus_list
          .map((n) => n.trim())
          .filter((n) => n !== "")
          .join(", ");
        const payload = {
          nama_seksi: formData.value.nama,
          nama_pengurus: gabunganPengurus,
        };
        if (modalMode.value === "add")
          await pengaturanService.addSeksi(payload);
        else await pengaturanService.updateSeksi(editId.value!, payload);
      } else if (activeTab.value === "akun") {
        if (modalMode.value === "add") {
          if (
            !formData.value.nama ||
            !formData.value.email ||
            !formData.value.password
          )
            throw new Error("Nama, Email, dan Password wajib diisi");
          await pengaturanService.addUser({
            name: formData.value.nama,
            email: formData.value.email,
            password: formData.value.password,
            role: formData.value.role,
          });
        } else {
          await pengaturanService.updateUser(editId.value!, {
            name: formData.value.nama,
            role: formData.value.role,
          });
        }
      }

      closeModal();
      await loadData();
      toast.success("Data berhasil disimpan!");

      if (activeTab.value === "akun" && editId.value === authStore.user?.id) {
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

  const deleteItem = async (id: number) => {
    isLoading.value = true;
    try {
      if (activeTab.value === "kategori")
        await pengaturanService.deleteKategori(id);
      else if (activeTab.value === "seksi")
        await pengaturanService.deleteSeksi(id);
      else if (activeTab.value === "akun")
        await pengaturanService.deleteUser(id);

      await loadData();
      toast.success("Data berhasil dihapus!");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      isLoading.value = false;
    }
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
    saveItem,
    deleteItem,
    addPengurusInput,
    removePengurusInput,
  };
}
