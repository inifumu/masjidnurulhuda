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
import { getCurrentWibPeriod } from "../../../../shared/contracts/index.ts";

export type KasTab = "laporan" | "approval" | "input" | "proposal";
export type KasFilterTipe = "semua" | "pemasukan" | "pengeluaran";

export type KasForm = {
  tipe: "pemasukan" | "pengeluaran";
  jumlah: string;
  kategori_id: number | null;
  seksi_id: number | null;
  metode: string;
  tanggal: string;
  keperluan: string;
  keterangan: string;
};

export const getWibDate = (now = new Date()) =>
  new Intl.DateTimeFormat("fr-CA", { timeZone: "Asia/Jakarta" }).format(now);

const initialNow = new Date();
const initialPeriod = getCurrentWibPeriod(initialNow);
const initialDate = getWibDate(initialNow);

export const activeTab = ref<KasTab>("laporan");
export const isLoading = ref(false);
export const isLoadingData = ref(false);
export const loadError = ref("");
export const hasLoadedData = ref(false);
export const pendingMutationIds = ref<Set<number>>(new Set());
export const transactions = ref<KasTransaction[]>([]);

export const kasSummary = ref<DashboardSummary>({
  saldoAwal: 0,
  totalPemasukan: 0,
  totalPengeluaran: 0,
  saldoAkhir: 0,
});

export const selectedMonth = ref(initialPeriod.month);
export const selectedYear = ref(initialPeriod.year);
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
  tanggal: initialDate,
  keperluan: "",
  keterangan: "",
});

export const formProposal = ref<KasForm>({
  tipe: "pengeluaran",
  jumlah: "",
  kategori_id: null,
  seksi_id: null,
  metode: "reimbursement",
  tanggal: initialDate,
  keperluan: "",
  keterangan: "",
});

export const openDropdown = ref<string | null>(null);
export const currentYear = initialPeriod.year;
