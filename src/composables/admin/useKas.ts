import { ref, computed, watch } from "vue";
import {
  kasService,
  type DirectTransactionPayload,
  type KasCategory,
  type KasMethod,
  type KasSection,
  type KasTransaction,
  type ProposalTransactionPayload,
} from "../../services/admin/kasService";
import {
  dashboardService,
  type DashboardSummary,
} from "../../services/admin/dashboardService";
import {
  formatRupiah,
  formatInputRupiah,
  parseInputRupiah,
} from "../../utils/currency";

const activeTab = ref<"laporan" | "approval" | "input" | "proposal">("laporan");
const isLoading = ref(false);
const transactions = ref<KasTransaction[]>([]);
const kasSummary = ref<DashboardSummary>({
  saldoAwal: 0,
  totalPemasukan: 0,
  totalPengeluaran: 0,
  saldoAkhir: 0,
});

const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());
const filterTipe = ref<"semua" | "pemasukan" | "pengeluaran">("semua");
const filterKategori = ref<number | "semua">("semua");

const categories = ref<KasCategory[]>([]);
const sections = ref<KasSection[]>([]);
const methods = ref<KasMethod[]>([]);
const hasLoadedMasterData = ref(false);

type KasForm = {
  tipe: "pemasukan" | "pengeluaran";
  jumlah: string;
  kategori_id: number | null;
  seksi_id: number | null;
  metode: string;
  tanggal: string;
  keterangan: string;
};

// Form Kas Langsung
const formInput = ref<KasForm>({
  tipe: "pemasukan",
  jumlah: "",
  kategori_id: null as number | null,
  seksi_id: null as number | null,
  metode: "kas_langsung",
  tanggal: new Date().toISOString().split("T")[0],
  keterangan: "",
});

const formProposal = ref<KasForm>({
  tipe: "pengeluaran",
  jumlah: "",
  kategori_id: null as number | null,
  seksi_id: null as number | null,
  metode: "reimbursement",
  tanggal: new Date().toISOString().split("T")[0],
  keterangan: "",
});

const openDropdown = ref<string | null>(null);

export function useKas() {
  const toggleDropdown = (name: string) =>
    (openDropdown.value = openDropdown.value === name ? null : name);
  const closeDropdowns = () => (openDropdown.value = null);
  const formatWaktuAudit = (dateString?: string | null) => {
    if (!dateString) return "-";
    // Karena CURRENT_TIMESTAMP SQLite itu UTC, kita konversi ke waktu lokal (WIB/WITA/WIT)
    const date = new Date(dateString + "Z");
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const currentYear = new Date().getFullYear();

  const filteredCategoriesInput = computed(() => {
    return categories.value.filter(
      (c) =>
        c.jenis_arus === formInput.value.tipe || c.jenis_arus === "general",
    );
  });

  const filteredCategoriesProposal = computed(() => {
    return categories.value.filter(
      (c) =>
        c.jenis_arus === formProposal.value.tipe || c.jenis_arus === "general",
    );
  });

  watch(
    () => formInput.value.tipe,
    () => {
      formInput.value.kategori_id = null;
    },
  );
  watch(
    () => formProposal.value.tipe,
    () => {
      formProposal.value.kategori_id = null;
    },
  );

  // --- WIDGET GLOBAL & LAPORAN ---
  const globalSaldoAwal = computed(() => kasSummary.value.saldoAwal);
  const globalMasuk = computed(() => kasSummary.value.totalPemasukan);
  const globalKeluar = computed(() => kasSummary.value.totalPengeluaran);
  const globalSaldoAkhir = computed(() => kasSummary.value.saldoAkhir);

  const filteredLaporan = computed(() => {
    return transactions.value.filter((t) => t.status === "approved");
  });

  const filteredMasuk = computed(() =>
    filteredLaporan.value
      .filter((t) => t.tipe === "pemasukan")
      .reduce((sum, t) => sum + t.jumlah, 0),
  );
  const filteredKeluar = computed(() =>
    filteredLaporan.value
      .filter((t) => t.tipe === "pengeluaran")
      .reduce((sum, t) => sum + t.jumlah, 0),
  );

  // 🟢 LOGIKA BARU (POIN 4): Strict Type Check tanpa startsWith
  const pendingTransactions = computed(() =>
    transactions.value.filter(
      (t) => t.status === "pending_ketua" || t.status === "pending_bendahara",
    ),
  );

  // Status rejected dibiarkan bersih seperti ini
  const rejectedTransactions = computed(() =>
    transactions.value.filter((t) => t.status === "rejected"),
  );

  const loadMasterData = async () => {
    if (hasLoadedMasterData.value) return;

    const master = await kasService.getMasterData();
    categories.value = master.categories || master.kategori || [];
    sections.value = master.sections || master.seksi || [];
    methods.value = kasService.getMethods();
    hasLoadedMasterData.value = true;
  };

  const loadTransactions = async () => {
    const requestFilters = {
      month: selectedMonth.value,
      year: selectedYear.value,
      tipe: filterTipe.value !== "semua" ? filterTipe.value : undefined,
      kategori_id:
        filterKategori.value !== "semua" ? filterKategori.value : undefined,
    };

    transactions.value = await kasService.getTransactions(requestFilters);
  };

  const loadSummary = async () => {
    kasSummary.value = await dashboardService.getSummary({
      month: selectedMonth.value,
      year: selectedYear.value,
    });
  };

  const loadData = async () => {
    isLoading.value = true;
    try {
      await loadMasterData();
      await Promise.all([loadTransactions(), loadSummary()]);
    } finally {
      isLoading.value = false;
    }
  };

  const handleDirectInput = async () => {
    isLoading.value = true;
    try {
      if (!formInput.value.kategori_id) {
        throw new Error("Kategori wajib dipilih");
      }

      const nominal = parseInputRupiah(formInput.value.jumlah);
      if (!Number.isFinite(nominal) || nominal <= 0) {
        throw new Error("Nominal wajib lebih dari 0");
      }

      const payload: DirectTransactionPayload = {
        ...formInput.value,
        jumlah: nominal,
        kategori_id: formInput.value.kategori_id,
      };

      await kasService.submitDirectTransaction(payload);
      formInput.value.jumlah = "";
      formInput.value.keterangan = "";
      formInput.value.seksi_id = null;
      activeTab.value = "laporan";
      await loadData();
    } finally {
      isLoading.value = false;
    }
  };

  const handleProposal = async () => {
    isLoading.value = true;
    try {
      if (!formProposal.value.kategori_id) {
        throw new Error("Kategori wajib dipilih");
      }
      if (!formProposal.value.seksi_id) {
        throw new Error("Seksi wajib dipilih");
      }

      const nominal = parseInputRupiah(formProposal.value.jumlah);
      if (!Number.isFinite(nominal) || nominal <= 0) {
        throw new Error("Nominal wajib lebih dari 0");
      }

      const payload: ProposalTransactionPayload = {
        ...formProposal.value,
        jumlah: nominal,
        kategori_id: formProposal.value.kategori_id,
        seksi_id: formProposal.value.seksi_id,
      };

      await kasService.submitProposal(payload);
      formProposal.value.jumlah = "";
      formProposal.value.keterangan = "";
      formProposal.value.seksi_id = null;
      activeTab.value = "approval";
      await loadData();
    } finally {
      isLoading.value = false;
    }
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    await kasService.approveTransaction(id, action);
    await loadData();
  };

  const handleDelete = async (id: number) => {
    await kasService.deleteTransaction(id);
    await loadData();
  };

  watch([selectedMonth, selectedYear], () => {
    void Promise.all([loadTransactions(), loadSummary()]);
  });

  watch([filterTipe, filterKategori], () => {
    void loadTransactions();
  });

  const availableYears = computed(() =>
    Array.from({ length: 5 }, (_, i) => currentYear - 2 + i),
  );

  return {
    activeTab,
    isLoading,
    transactions,
    categories,
    filteredCategoriesInput,
    filteredCategoriesProposal,
    sections,
    methods,
    formInput,
    formProposal,
    openDropdown,
    toggleDropdown,
    closeDropdowns,
    formatRupiah,
    formatWaktuAudit,
    formatInputRupiah,
    parseInputRupiah,
    selectedMonth,
    selectedYear,
    filterTipe,
    filterKategori,
    availableYears,
    globalSaldoAwal,
    globalMasuk,
    globalKeluar,
    globalSaldoAkhir,
    filteredLaporan,
    filteredMasuk,
    filteredKeluar,
    pendingTransactions,
    rejectedTransactions,
    loadData,
    handleDirectInput,
    handleProposal,
    handleAction,
    handleDelete,
  };
}
