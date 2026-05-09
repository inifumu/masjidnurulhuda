import { ref, onMounted } from "vue";
import {
  dashboardService,
  type DashboardSummary,
} from "../../services/admin/dashboardService";
import { toast } from "vue-sonner";

export function useDashboard() {
  const summary = ref<DashboardSummary>({
    saldoAwal: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoAkhir: 0,
  });

  const isLoading = ref(true);

  const fetchSummary = async () => {
    isLoading.value = true;
    try {
      summary.value = await dashboardService.getSummary();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Gagal memuat ringkasan dashboard";
      console.error("Gagal memuat ringkasan kas:", e);
      toast.error(message);
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    fetchSummary();
  });

  return {
    summary,
    isLoading,
    fetchSummary,
  };
}
