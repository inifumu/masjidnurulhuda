/**
 * Tujuan: Menyimpan state global singleton untuk fitur Pengaturan (kategori, seksi, akun).
 * Caller: usePengaturan facade dan modul domain pengaturan.
 * Dependensi: Vue reactivity, tipe DTO dari pengaturanService.
 * Main Functions: Menyediakan refs untuk tab aktif, list data, modal state, dan form state.
 * Side Effects: Tidak ada side effect langsung; hanya inisialisasi state.
 */
import { ref } from "vue";
import type {
  JenisArus,
  KategoriItem,
  SeksiItem,
  UserItem,
  UserRole,
} from "../../../services/admin/pengaturanService";

export type PengaturanTab = "kategori" | "seksi" | "akun";

export interface PengaturanForm {
  nama: string;
  jenis_arus: JenisArus;
  nama_pengurus: string;
  nama_pengurus_list: string[];
  role: UserRole;
  email: string;
  password: string;
}

export type EditablePengaturanItem = Partial<
  KategoriItem & SeksiItem & UserItem
>;

export const activeTab = ref<PengaturanTab>("kategori");
export const isLoading = ref(false);
export const errorMessage = ref("");

export const kategoriList = ref<KategoriItem[]>([]);
export const seksiList = ref<SeksiItem[]>([]);
export const akunList = ref<UserItem[]>([]);

export const isModalOpen = ref(false);
export const modalMode = ref<"add" | "edit">("add");
export const editId = ref<number | null>(null);

export const openDropdown = ref<string | null>(null);

export const formData = ref<PengaturanForm>({
  nama: "",
  jenis_arus: "pemasukan",
  nama_pengurus: "",
  nama_pengurus_list: [""],
  role: "pengurus",
  email: "",
  password: "",
});
