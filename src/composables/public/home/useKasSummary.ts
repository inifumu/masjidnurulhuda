import { ref, onMounted } from "vue";
import { kasSummaryService } from "../../../services/public/home/kasSummaryService";

export function useKasSummary() {
  const kasSummary = ref({
    total_saldo: 0,
    pemasukan_bulan_ini: 0,
    pengeluaran_bulan_ini: 0,
  });
  const isLoadingKas = ref(true);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka || 0);

  const loadKas = async () => {
    try {
      const json = await kasSummaryService.fetchSummary();
      if (json.status === "success") {
        kasSummary.value = json.data;
      }
    } catch (error) {
      console.error("Gagal menarik data kas", error);
    } finally {
      isLoadingKas.value = false;
    }
  };

  onMounted(() => {
    loadKas();
  });

  return { kasSummary, isLoadingKas, formatRupiah };
}
