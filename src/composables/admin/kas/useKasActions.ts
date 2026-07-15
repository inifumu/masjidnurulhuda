/**
 * Tujuan: Menyediakan aksi async/sync untuk lifecycle data dan submit transaksi kas.
 * Caller: useKas facade (dipakai oleh komponen Kas*).
 * Dependensi: kasService, state dari useKasState, DTO summary dashboard.
 * Main Functions: loadData, submit transaksi langsung/proposal, approve/reject, delete.
 * Side Effects: Melakukan network request API dan mutasi state global kas.
 */
import type { DashboardSummary } from "../../../services/admin/dashboardService";
import {
  buildDirectTransactionPayload,
  buildProposalTransactionPayload,
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
  hasLoadedData,
  hasLoadedMasterData,
  isLoading,
  isLoadingData,
  loadError,
  kasSummary,
  methods,
  openDropdown,
  pendingMutationIds,
  sections,
  selectedMonth,
  selectedYear,
  transactions,
} from "./useKasState";
import { createIntentKeyStore, createLatestRequestGate } from "./requestState";

const directIntentKeys = createIntentKeyStore();
const proposalIntentKeys = createIntentKeyStore();
const bundleGate = createLatestRequestGate();
const transactionGate = createLatestRequestGate();
const mutationKeys = new Map<string, string>();

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
  const request = transactionGate.begin();
  isLoadingData.value = true;
  loadError.value = "";
  try {
    const result = await kasService.getTransactions({
      month: selectedMonth.value,
      year: selectedYear.value,
      tipe: filterTipe.value !== "semua" ? filterTipe.value : undefined,
      kategori_id:
        filterKategori.value !== "semua" ? filterKategori.value : undefined,
    });
    if (transactionGate.isLatest(request)) {
      transactions.value = result;
      hasLoadedData.value = true;
    }
  } catch (error) {
    if (transactionGate.isLatest(request)) {
      loadError.value =
        error instanceof Error ? error.message : "Gagal memuat transaksi.";
    }
    throw error;
  } finally {
    if (transactionGate.isLatest(request)) isLoadingData.value = false;
  }
};

export const loadSummary = async () => {
  kasSummary.value = await kasService
    .getDashboardBundle(buildKasFilters())
    .then((bundle) => bundle.summary);
};

export const loadData = async () => {
  const bundleRequest = bundleGate.begin();
  const transactionRequest = transactionGate.begin();
  isLoadingData.value = true;
  loadError.value = "";
  try {
    await loadMasterData();
    const bundle = await kasService.getDashboardBundle(buildKasFilters());
    if (bundleGate.isLatest(bundleRequest)) {
      kasSummary.value = bundle.summary;
      hasLoadedData.value = true;
      if (transactionGate.isLatest(transactionRequest)) {
        transactions.value = bundle.transactions;
      }
    }
  } catch (error) {
    if (bundleGate.isLatest(bundleRequest)) {
      loadError.value =
        error instanceof Error ? error.message : "Gagal memuat data kas.";
    }
    throw error;
  } finally {
    if (bundleGate.isLatest(bundleRequest)) isLoadingData.value = false;
  }
};

const resetFormInputAfterSubmit = () => {
  directIntentKeys.clear();
  formInput.value.jumlah = "";
  formInput.value.keterangan = "";
  formInput.value.seksi_id = null;
};

const resetFormProposalAfterSubmit = () => {
  proposalIntentKeys.clear();
  formProposal.value.jumlah = "";
  formProposal.value.keterangan = "";
  formProposal.value.seksi_id = null;
};

export const handleDirectInput = async () => {
  isLoading.value = true;
  try {
    const payload = buildDirectTransactionPayload(formInput.value);
    await kasService.submitDirectTransaction(
      payload,
      directIntentKeys.forPayload(payload),
    );
    resetFormInputAfterSubmit();
    activeTab.value = "laporan";
    await loadData().catch(() => undefined);
  } finally {
    isLoading.value = false;
  }
};

export const handleProposal = async () => {
  isLoading.value = true;
  try {
    const payload = buildProposalTransactionPayload(formProposal.value);
    await kasService.submitProposal(
      payload,
      proposalIntentKeys.forPayload(payload),
    );
    resetFormProposalAfterSubmit();
    activeTab.value = "approval";
    await loadData().catch(() => undefined);
  } finally {
    isLoading.value = false;
  }
};

export const handleAction = async (
  id: number,
  action: "approve" | "reject",
  reason?: string,
) => {
  if (pendingMutationIds.value.has(id)) return false;
  const intent = `${action}:${id}:${reason ?? ""}`;
  const key = mutationKeys.get(intent) ?? crypto.randomUUID();
  mutationKeys.set(intent, key);
  pendingMutationIds.value = new Set(pendingMutationIds.value).add(id);
  try {
    await kasService.approveTransaction(id, action, reason, key);
    mutationKeys.delete(intent);
    await loadData().catch(() => undefined);
    return true;
  } finally {
    const next = new Set(pendingMutationIds.value);
    next.delete(id);
    pendingMutationIds.value = next;
  }
};

export const handleVoid = async (id: number, reason: string) => {
  if (pendingMutationIds.value.has(id)) return false;
  const intent = `void:${id}:${reason}`;
  const key = mutationKeys.get(intent) ?? crypto.randomUUID();
  mutationKeys.set(intent, key);
  pendingMutationIds.value = new Set(pendingMutationIds.value).add(id);
  try {
    await kasService.voidTransaction(id, reason, key);
    mutationKeys.delete(intent);
    await loadData().catch(() => undefined);
    return true;
  } finally {
    const next = new Set(pendingMutationIds.value);
    next.delete(id);
    pendingMutationIds.value = next;
  }
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
