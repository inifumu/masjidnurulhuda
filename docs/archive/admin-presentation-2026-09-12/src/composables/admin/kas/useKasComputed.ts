/**
 * Tujuan: Menyediakan computed state turunan untuk dashboard, laporan, dan filter kas.
 * Caller: useKas facade dan komponen Kas* (melalui facade).
 * Dependensi: Vue computed, state dari useKasState.
 * Main Functions: Filter kategori by tipe, ringkasan saldo, agregasi laporan, list tahun.
 * Side Effects: Tidak ada side effect; seluruh output bersifat computed-only.
 */
import { computed } from "vue";
import {
  categories,
  currentYear,
  filterKategori,
  formInput,
  formProposal,
  kasSummary,
  transactions,
} from "./useKasState";

export const filteredCategoriesInput = computed(() => {
  return categories.value.filter(
    (c) => c.jenis_arus === formInput.value.tipe || c.jenis_arus === "general",
  );
});

export const filteredCategoriesProposal = computed(() => {
  return categories.value.filter(
    (c) =>
      c.jenis_arus === formProposal.value.tipe || c.jenis_arus === "general",
  );
});

export const globalSaldoAwal = computed(() => kasSummary.value.saldoAwal);
export const globalMasuk = computed(() => kasSummary.value.totalPemasukan);
export const globalKeluar = computed(() => kasSummary.value.totalPengeluaran);
export const globalSaldoAkhir = computed(() => kasSummary.value.saldoAkhir);

export const filteredLaporan = computed(() => {
  return transactions.value.filter(
    (t) => t.status === "approved" || t.status === "void",
  );
});

export const filteredMasuk = computed(() =>
  filteredLaporan.value
    .filter((t) => t.status === "approved" && t.tipe === "pemasukan")
    .reduce((sum, t) => sum + t.jumlah, 0),
);

export const filteredKeluar = computed(() =>
  filteredLaporan.value
    .filter((t) => t.status === "approved" && t.tipe === "pengeluaran")
    .reduce((sum, t) => sum + t.jumlah, 0),
);

export const pendingTransactions = computed(() =>
  transactions.value.filter(
    (t) => t.status === "pending_ketua" || t.status === "pending_bendahara",
  ),
);

export const rejectedTransactions = computed(() =>
  transactions.value.filter((t) => t.status === "rejected"),
);

export const availableYears = computed(() =>
  Array.from({ length: 5 }, (_, i) => currentYear - 2 + i),
);

export const hasActiveKategoriFilter = computed(
  () => filterKategori.value !== "semua",
);
