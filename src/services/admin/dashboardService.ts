import { httpClient } from "../httpClient";

// ==========================================
// 🛡️ INTERFACES / DTO
// ==========================================
export interface DashboardSummary {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhir: number;
}

// ==========================================
// 🚀 SERVICE METHODS
// ==========================================
export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await httpClient("/api/admin/dashboard/summary");
    return res.data;
  },
};
