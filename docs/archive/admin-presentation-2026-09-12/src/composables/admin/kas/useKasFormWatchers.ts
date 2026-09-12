/**
 * Tujuan: Menangani watcher khusus form kas agar kategori reset ketika tipe arus berubah.
 * Caller: useKas facade.
 * Dependensi: Vue watch, state form dari useKasState.
 * Main Functions: registerKasFormWatchers().
 * Side Effects: Mutasi kategori_id pada form input/proposal.
 */
import { watch } from "vue";
import { formInput, formProposal } from "./useKasState";

let isFormWatcherRegistered = false;

export const registerKasFormWatchers = () => {
  if (isFormWatcherRegistered) return;

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

  isFormWatcherRegistered = true;
};
