import { onMounted, ref } from "vue";
import { kasSummaryService, type KasSummary } from "../../../services/public/home/kasSummaryService";

const EMPTY_SUMMARY: KasSummary = { total_saldo: 0, pemasukan_bulan_ini: 0, pengeluaran_bulan_ini: 0 };

export function useKasSummary() {
  const kasSummary = ref<KasSummary>({ ...EMPTY_SUMMARY });
  const isLoadingKas = ref(true);
  const errorMessage = ref("");
  const hasLoadedKas = ref(false);

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(Number.isFinite(angka) ? angka : 0);

  const loadKas = async () => {
    isLoadingKas.value = true;
    errorMessage.value = "";
    try {
      kasSummary.value = await kasSummaryService.fetchSummary();
      hasLoadedKas.value = true;
    } catch {
      errorMessage.value = "Ringkasan kas belum dapat dimuat. Silakan coba lagi.";
    } finally {
      isLoadingKas.value = false;
    }
  };

  onMounted(loadKas);
  return { kasSummary, isLoadingKas, errorMessage, hasLoadedKas, formatRupiah, loadKas };
}
