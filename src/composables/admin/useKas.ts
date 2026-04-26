import { ref, computed, watch } from "vue";
import { kasService } from "../../services/admin/kasService";

const activeTab = ref<"laporan" | "approval" | "input" | "proposal">("laporan");
const isLoading = ref(false);
const transactions = ref<any[]>([]);

const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());
const filterTipe = ref<"semua" | "pemasukan" | "pengeluaran">("semua");
const filterKategori = ref<number | "semua">("semua");

const categories = ref<any[]>([]);
const sections = ref<any[]>([]);
const methods = ref<any[]>([]);

// 🟢 UPDATE: Tambahkan seksi_id ke formInput Kas Langsung
const formInput = ref({
  tipe: "pemasukan",
  jumlah: "",
  kategori_id: null as number | null,
  seksi_id: null as number | null, // <-- INI BARU
  metode: "kas_langsung",
  tanggal: new Date().toISOString().split("T")[0],
  keterangan: "",
});

const formProposal = ref({
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
  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);

  const currentMonth = new Date().getMonth() + 1;
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
  const globalSaldoAwal = computed(() => {
    return transactions.value.reduce((total, t) => {
      const d = new Date(t.tanggal);
      const isBefore =
        d.getFullYear() < currentYear ||
        (d.getFullYear() === currentYear && d.getMonth() + 1 < currentMonth);
      if (t.status === "approved" && isBefore)
        return t.tipe === "pemasukan" ? total + t.jumlah : total - t.jumlah;
      return total;
    }, 0);
  });
  const globalMasuk = computed(() =>
    transactions.value
      .filter(
        (t) =>
          t.status === "approved" &&
          new Date(t.tanggal).getMonth() + 1 === currentMonth &&
          new Date(t.tanggal).getFullYear() === currentYear &&
          t.tipe === "pemasukan",
      )
      .reduce((sum, t) => sum + t.jumlah, 0),
  );
  const globalKeluar = computed(() =>
    transactions.value
      .filter(
        (t) =>
          t.status === "approved" &&
          new Date(t.tanggal).getMonth() + 1 === currentMonth &&
          new Date(t.tanggal).getFullYear() === currentYear &&
          t.tipe === "pengeluaran",
      )
      .reduce((sum, t) => sum + t.jumlah, 0),
  );
  const globalSaldoAkhir = computed(
    () => globalSaldoAwal.value + globalMasuk.value - globalKeluar.value,
  );

  const filteredLaporan = computed(() => {
    return transactions.value.filter((t) => {
      if (t.status !== "approved") return false;
      const d = new Date(t.tanggal);
      if (
        d.getMonth() + 1 !== selectedMonth.value ||
        d.getFullYear() !== selectedYear.value
      )
        return false;
      if (filterTipe.value !== "semua" && t.tipe !== filterTipe.value)
        return false;
      if (
        filterKategori.value !== "semua" &&
        t.kategori_id !== filterKategori.value
      )
        return false;
      return true;
    });
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

  const pendingTransactions = computed(() =>
    transactions.value.filter((t) => t.status === "pending"),
  );
  const rejectedTransactions = computed(() =>
    transactions.value.filter((t) => t.status === "rejected"),
  );

  const loadData = async () => {
    isLoading.value = true;
    try {
      const master = await kasService.getMasterData();

      // 🟢 BUG FIX: Tangkap nama array 'categories' atau 'kategori', dan 'sections' atau 'seksi'
      categories.value = master.categories || master.kategori || [];
      sections.value = master.sections || master.seksi || [];

      methods.value = kasService.getMethods();
      transactions.value = await kasService.getTransactions();
    } finally {
      isLoading.value = false;
    }
  };

  const handleDirectInput = async () => {
    isLoading.value = true;
    try {
      await kasService.submitDirectTransaction({ ...formInput.value });
      formInput.value.jumlah = "";
      formInput.value.keterangan = "";
      formInput.value.seksi_id = null; // Reset seksi
      activeTab.value = "laporan";
      await loadData();
    } finally {
      isLoading.value = false;
    }
  };

  const handleProposal = async () => {
    isLoading.value = true;
    try {
      await kasService.submitProposal({ ...formProposal.value });
      formProposal.value.jumlah = "";
      formProposal.value.keterangan = "";
      formProposal.value.seksi_id = null; // Reset seksi
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
