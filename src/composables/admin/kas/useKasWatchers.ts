/**
 * Tujuan: Menangani watcher reaktif untuk perubahan filter dan periode pada modul kas.
 * Caller: useKas facade.
 * Dependensi: Vue watch, state dari useKasState, action loader dari useKasActions.
 * Main Functions: Sinkronisasi auto-refresh transaksi & ringkasan saat filter berubah.
 * Side Effects: Memicu network request melalui loadData/loadTransactions.
 */
import { watch } from "vue";
import {
  filterKategori,
  filterTipe,
  selectedMonth,
  selectedYear,
} from "./useKasState";
import { loadData, loadTransactions } from "./useKasActions";

let isWatcherRegistered = false;

export const registerKasWatchers = () => {
  if (isWatcherRegistered) return;

  watch([selectedMonth, selectedYear], () => {
    void loadData();
  });

  watch([filterTipe, filterKategori], () => {
    void loadTransactions();
  });

  isWatcherRegistered = true;
};
