import * as dashboardRepo from "../db/queries/dashboard";

type DashboardPeriodFilter = {
  month: number;
  year: number;
};

export const getDashboardSummary = async (
  db: D1Database,
  period: DashboardPeriodFilter,
) => {
  return await dashboardRepo.getKasSummary(db, period);
};
