/**
 * Tujuan: Menyediakan aksi async/sync untuk lifecycle data dan submit transaksi kas.
 * Caller: useKas facade (dipakai oleh komponen Kas*).
 * Dependensi: kasService, state dari useKasState, DTO summary dashboard.
 * Main Functions: loadData, submit transaksi langsung/proposal, approve/reject, delete.
 * Side Effects: Melakukan network request API dan mutasi state global kas.
 */
import type { DashboardSummary } from "../../../services/admin/dashboardService";
import {
  kasService,
  type KasFilters,
} from "../../../services/admin/kasService";
import {
  activeTab,
  categories,
  filterKategori,
  filterTipe,
  formInput,
  formProposal,
  hasLoadedMasterData,
  isLoading,
  kasSummary,
  methods,
  openDropdown,
  sections,
  selectedMonth,
  selectedYear,
  transactions,
} from "./useKasState";

export const toggleDropdown = (name: string) => {
  openDropdown.value = openDropdown.value === name ? null : name;
};

export const closeDropdowns = () => {
  openDropdown.value = null;
};

export const formatWaktuAudit = (dateString?: string | null) => {
  if (!dateString) return "-";
  const date = new Date(`${dateString}Z`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const loadMasterData = async () => {
  if (hasLoadedMasterData.value) return;

  const master = await kasService.getMasterData();
  categories.value = master.categories || master.kategori || [];
  sections.value = master.sections || master.seksi || [];
  methods.value = kasService.getMethods();
  hasLoadedMasterData.value = true;
};

const buildKasFilters = (): KasFilters => ({
  month: selectedMonth.value,
  year: selectedYear.value,
  tipe: filterTipe.value,
  kategori: filterKategori.value,
});

export const loadTransactions = async () => {
  transactions.value = await kasService.getTransactions({
    month: selectedMonth.value,
    year: selectedYear.value,
    tipe: filterTipe.value !== "semua" ? filterTipe.value : undefined,
    kategori_id:
      filterKategori.value !== "semua" ? filterKategori.value : undefined,
  });
};

export const loadSummary = async () => {
  kasSummary.value = await kasService
    .getDashboardBundle(buildKasFilters())
    .then((bundle) => bundle.summary);
};

export const loadData = async () => {
  isLoading.value = true;
  try {
    await loadMasterData();
    const bundle = await kasService.getDashboardBundle(buildKasFilters());
    transactions.value = bundle.transactions;
    kasSummary.value = bundle.summary;
  } finally {
    isLoading.value = false;
  }
};

const resetFormInputAfterSubmit = () => {
  formInput.value.jumlah = "";
  formInput.value.keterangan = "";
  formInput.value.seksi_id = null;
};

const resetFormProposalAfterSubmit = () => {
  formProposal.value.jumlah = "";
  formProposal.value.keterangan = "";
  formProposal.value.seksi_id = null;
};

export const handleDirectInput = async () => {
  isLoading.value = true;
  try {
    await kasService.submitDirectTransactionFromForm(formInput.value);
    resetFormInputAfterSubmit();
    activeTab.value = "laporan";
    await loadData();
  } finally {
    isLoading.value = false;
  }
};

export const handleProposal = async () => {
  isLoading.value = true;
  try {
    await kasService.submitProposalFromForm(formProposal.value);
    resetFormProposalAfterSubmit();
    activeTab.value = "approval";
    await loadData();
  } finally {
    isLoading.value = false;
  }
};

export const handleAction = async (
  id: number,
  action: "approve" | "reject",
) => {
  await kasService.approveTransaction(id, action);
  await loadData();
};

export const handleDelete = async (id: number) => {
  await kasService.deleteTransaction(id);
  await loadData();
};

export const resetKasSummary = () => {
  const defaultSummary: DashboardSummary = {
    saldoAwal: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoAkhir: 0,
  };
  kasSummary.value = defaultSummary;
};
