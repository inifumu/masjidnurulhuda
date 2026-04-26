import * as dashboardRepo from "../db/queries/dashboard";

export const getDashboardSummary = async (db: D1Database) => {
  return await dashboardRepo.getKasSummary(db);
};
