import { httpClient } from "../httpClient";

// ==========================================
// 🛡️ INTERFACES / DTO
// ==========================================
export interface DashboardSummary {
  saldoAwal: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhir: number;
}

// ==========================================
// 🚀 SERVICE METHODS
// ==========================================
type DashboardSummaryResponse = {
  data: DashboardSummary;
};

type DashboardSummaryParams = {
  month: number;
  year: number;
};

export const dashboardService = {
  async getSummary(params?: DashboardSummaryParams): Promise<DashboardSummary> {
    const query = params
      ? `?month=${encodeURIComponent(String(params.month))}&year=${encodeURIComponent(String(params.year))}`
      : "";

    const res = await httpClient<DashboardSummaryResponse>(
      `/api/admin/dashboard/summary${query}`,
    );
    return res.data;
  },
};
