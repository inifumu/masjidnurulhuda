import { ref, onMounted, watch } from "vue";
import { useAuthStore } from "../../stores/authStore";
import { toast } from "vue-sonner"; // 🟢 Ganti alert bawaan jadi Toast biar keren

export function usePengaturan() {
  const authStore = useAuthStore();

  // State Navigasi
  const activeTab = ref<"kategori" | "seksi" | "akun">("kategori");
  const isLoading = ref(false);
  const errorMessage = ref("");

  // State Data
  const kategoriList = ref<any[]>([]);
  const seksiList = ref<any[]>([]);
  const akunList = ref<any[]>([]);

  // State Modal Form
  const isModalOpen = ref(false);
  const modalMode = ref<"add" | "edit">("add");
  const editId = ref<number | null>(null);

  // 🟢 State Dropdown Custom
  const openDropdown = ref<string | null>(null);
  const toggleDropdown = (name: string) => {
    openDropdown.value = openDropdown.value === name ? null : name;
  };
  const closeDropdowns = () => {
    openDropdown.value = null;
  };

  // Form Data
  const formData = ref({
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
      let endpoint = "";
      if (activeTab.value === "kategori")
        endpoint = "/api/admin/pengaturan/kategori";
      else if (activeTab.value === "seksi")
        endpoint = "/api/admin/pengaturan/seksi";
      else if (activeTab.value === "akun")
        endpoint = "/api/admin/pengaturan/users";

      const res = await fetch(endpoint);
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Gagal memuat data");

      if (activeTab.value === "kategori") kategoriList.value = json.data || [];
      else if (activeTab.value === "seksi") seksiList.value = json.data || [];
      else if (activeTab.value === "akun") akunList.value = json.data || [];
    } catch (error: any) {
      errorMessage.value = error.message;
    } finally {
      isLoading.value = false;
    }
  };

  watch(activeTab, () => loadData());
  onMounted(() => loadData());

  const addPengurusInput = () => {
    formData.value.nama_pengurus_list.push("");
  };

  const removePengurusInput = (index: number) => {
    formData.value.nama_pengurus_list.splice(index, 1);
  };

  const openModal = (mode: "add" | "edit", item?: any) => {
    modalMode.value = mode;
    errorMessage.value = "";
    closeDropdowns(); // Tutup dropdown jika ada yang kebuka

    if (mode === "edit" && item) {
      editId.value = item.id;
      if (activeTab.value === "kategori") {
        formData.value.nama = item.nama_kategori || item.name;
        formData.value.jenis_arus = item.jenis_arus || "pemasukan";
      } else if (activeTab.value === "seksi") {
        formData.value.nama = item.nama_seksi;
        formData.value.nama_pengurus_list = item.nama_pengurus
          ? item.nama_pengurus.split(", ")
          : [""];
      } else if (activeTab.value === "akun") {
        formData.value.nama = item.name;
        formData.value.email = item.email;
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
    formData.value.nama = "";
    formData.value.jenis_arus = "pemasukan";
    formData.value.nama_pengurus = "";
    formData.value.nama_pengurus_list = [""];
    formData.value.email = "";
    formData.value.password = "";
    formData.value.role = "pengurus";
  };

  const saveItem = async () => {
    isLoading.value = true;

    try {
      let url = "";
      let method = modalMode.value === "add" ? "POST" : "PUT";
      let payload: any = {};

      if (activeTab.value === "kategori") {
        if (!formData.value.nama) throw new Error("Nama kategori wajib diisi");
        url =
          modalMode.value === "add"
            ? "/api/admin/pengaturan/kategori"
            : `/api/admin/pengaturan/kategori/${editId.value}`;

        payload = {
          nama_kategori: formData.value.nama,
          jenis_arus: formData.value.jenis_arus,
        };
      } else if (activeTab.value === "seksi") {
        if (!formData.value.nama) throw new Error("Nama seksi wajib diisi");
        url =
          modalMode.value === "add"
            ? "/api/admin/pengaturan/seksi"
            : `/api/admin/pengaturan/seksi/${editId.value}`;

        const gabunganPengurus = formData.value.nama_pengurus_list
          .map((n) => n.trim())
          .filter((n) => n !== "")
          .join(", ");

        payload = {
          nama_seksi: formData.value.nama,
          nama_pengurus: gabunganPengurus,
        };
      } else if (activeTab.value === "akun") {
        if (modalMode.value === "add") {
          if (
            !formData.value.nama ||
            !formData.value.email ||
            !formData.value.password
          )
            throw new Error("Nama, Email, dan Password wajib diisi");
          url = "/api/admin/pengaturan/users";
          payload = {
            name: formData.value.nama,
            email: formData.value.email,
            password: formData.value.password,
            role: formData.value.role,
          };
        } else {
          url = `/api/admin/pengaturan/users/${editId.value}`;
          payload = { name: formData.value.nama, role: formData.value.role };
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Gagal menyimpan data");
      }

      closeModal();
      await loadData();
      toast.success("Data berhasil disimpan!");

      if (activeTab.value === "akun" && editId.value === authStore.user?.id) {
        toast.warning(
          "Profil/Role Anda diubah! Silakan Logout dan Login kembali.",
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteItem = async (id: number) => {
    // 🟢 HAPUS ALERT CONFIRM BAWAAN DI SINI! (Sudah dipindah ke Vue Modal)
    isLoading.value = true;

    let endpoint = "";
    if (activeTab.value === "kategori")
      endpoint = `/api/admin/pengaturan/kategori/${id}`;
    else if (activeTab.value === "seksi")
      endpoint = `/api/admin/pengaturan/seksi/${id}`;
    else if (activeTab.value === "akun")
      endpoint = `/api/admin/pengaturan/users/${id}`;

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus data");
      await loadData();
      toast.success("Data berhasil dihapus!");
    } catch (error: any) {
      toast.error(error.message);
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
