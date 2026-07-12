/*
  Tujuan: Composable ringkasan dashboard admin dengan state periode (month/year) sebagai source-of-truth UI.
  Caller: src/components/legacy/DashboardLegacyBridge.vue.
  Dependensi: src/services/admin/dashboardService, vue-sonner.
  Main Functions: fetchSummary(period), updatePeriod, sinkronisasi loading + error notification.
  Side Effects: Trigger request GET /api/admin/dashboard/summary?month=&year= saat mount dan saat periode diganti.
*/
import { onMounted, ref } from "vue";
import {
  dashboardService,
  type DashboardSummary,
} from "../../services/admin/dashboardService";
import { toast } from "vue-sonner";

export type DashboardPeriod = {
  month: number;
  year: number;
};

const getCurrentWibPeriod = (): DashboardPeriod => {
  const nowWib = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );

  return {
    month: nowWib.getMonth() + 1,
    year: nowWib.getFullYear(),
  };
};

export function useDashboard() {
  const summary = ref<DashboardSummary>({
    saldoAwal: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoAkhir: 0,
  });

  const selectedPeriod = ref<DashboardPeriod>(getCurrentWibPeriod());
  const isLoading = ref(true);

  const fetchSummary = async (
    period: DashboardPeriod = selectedPeriod.value,
  ) => {
    isLoading.value = true;
    try {
      summary.value = await dashboardService.getSummary(period);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Gagal memuat ringkasan dashboard";
      console.error("Gagal memuat ringkasan kas:", e);
      toast.error(message);
    } finally {
      isLoading.value = false;
    }
  };

  const updatePeriod = async (period: DashboardPeriod) => {
    selectedPeriod.value = period;
    await fetchSummary(period);
  };

  onMounted(() => {
    fetchSummary();
  });

  return {
    summary,
    selectedPeriod,
    isLoading,
    fetchSummary,
    updatePeriod,
  };
}
