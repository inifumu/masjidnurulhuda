/**
 * Tujuan: Facade composable Manajemen Kas agar kontrak API ke komponen tetap stabil.
 * Caller: KeuanganKas.vue, KasInput.vue, KasProposal.vue, KasApproval.vue, KasLaporan.vue.
 * Dependensi: Modul kas terpecah (state/actions/computed/watchers), util currency.
 * Main Functions: useKas() mengembalikan seluruh state, computed, dan actions yang sudah kompatibel.
 * Side Effects: Registrasi watcher singleton untuk sinkronisasi data saat filter/periode berubah.
 */
import {
  formatInputRupiah,
  formatRupiah,
  parseInputRupiah,
} from "../../utils/currency";
import {
  handleAction,
  handleVoid,
  handleDirectInput,
  handleProposal,
  loadData,
  closeDropdowns,
  formatWaktuAudit,
  toggleDropdown,
} from "./kas/useKasActions";
import {
  availableYears,
  filteredCategoriesInput,
  filteredCategoriesProposal,
  filteredKeluar,
  filteredLaporan,
  filteredMasuk,
  globalKeluar,
  globalMasuk,
  globalSaldoAkhir,
  globalSaldoAwal,
  pendingTransactions,
  rejectedTransactions,
} from "./kas/useKasComputed";
import { registerKasFormWatchers } from "./kas/useKasFormWatchers";
import {
  activeTab,
  categories,
  filterKategori,
  filterTipe,
  formInput,
  formProposal,
  hasLoadedData,
  isLoading,
  isLoadingData,
  loadError,
  methods,
  openDropdown,
  pendingMutationIds,
  sections,
  selectedMonth,
  selectedYear,
  transactions,
} from "./kas/useKasState";
import { registerKasWatchers } from "./kas/useKasWatchers";

export function useKas() {
  registerKasFormWatchers();
  registerKasWatchers();

  return {
    activeTab,
    isLoading,
    isLoadingData,
    loadError,
    hasLoadedData,
    transactions,
    categories,
    filteredCategoriesInput,
    filteredCategoriesProposal,
    sections,
    methods,
    formInput,
    formProposal,
    openDropdown,
    pendingMutationIds,
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
    handleVoid,
  };
}
