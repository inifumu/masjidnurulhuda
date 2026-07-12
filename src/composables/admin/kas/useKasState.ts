/**
 * Tujuan: Menyimpan state global untuk fitur Manajemen Kas (singleton composable state).
 * Caller: useKas facade dan modul turunan (computed/actions/watchers).
 * Dependensi: Vue reactivity, DTO dari kasService, summary dari dashboardService.
 * Main Functions: Menyediakan refs state, form input/proposal, dan filter aktif.
 * Side Effects: Tidak ada side effect langsung; hanya inisialisasi state reaktif.
 */
import { ref } from "vue";
import type {
  KasCategory,
  KasMethod,
  KasSection,
  KasTransaction,
} from "../../../services/admin/kasService";
import type { DashboardSummary } from "../../../services/admin/dashboardService";

export type KasTab = "laporan" | "approval" | "input" | "proposal";
export type KasFilterTipe = "semua" | "pemasukan" | "pengeluaran";

export type KasForm = {
  tipe: "pemasukan" | "pengeluaran";
  jumlah: string;
  kategori_id: number | null;
  seksi_id: number | null;
  metode: string;
  tanggal: string;
  keterangan: string;
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

export const activeTab = ref<KasTab>("laporan");
export const isLoading = ref(false);
export const transactions = ref<KasTransaction[]>([]);

export const kasSummary = ref<DashboardSummary>({
  saldoAwal: 0,
  totalPemasukan: 0,
  totalPengeluaran: 0,
  saldoAkhir: 0,
});

export const selectedMonth = ref(new Date().getMonth() + 1);
export const selectedYear = ref(new Date().getFullYear());
export const filterTipe = ref<KasFilterTipe>("semua");
export const filterKategori = ref<number | "semua">("semua");

export const categories = ref<KasCategory[]>([]);
export const sections = ref<KasSection[]>([]);
export const methods = ref<KasMethod[]>([]);
export const hasLoadedMasterData = ref(false);

export const formInput = ref<KasForm>({
  tipe: "pemasukan",
  jumlah: "",
  kategori_id: null,
  seksi_id: null,
  metode: "kas_langsung",
  tanggal: getTodayDate(),
  keterangan: "",
});

export const formProposal = ref<KasForm>({
  tipe: "pengeluaran",
  jumlah: "",
  kategori_id: null,
  seksi_id: null,
  metode: "reimbursement",
  tanggal: getTodayDate(),
  keterangan: "",
});

export const openDropdown = ref<string | null>(null);
export const currentYear = new Date().getFullYear();
