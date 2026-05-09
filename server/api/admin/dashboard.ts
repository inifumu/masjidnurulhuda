import { Hono } from "hono";
import * as dashboardService from "../../services/dashboard";
import { requireAuth, requireRole } from "../../middleware/auth";
import { sendSuccess, sendError } from "../../utils/response";

type DashboardPeriodFilter = {
  month: number;
  year: number;
};

const getCurrentWibPeriod = (): DashboardPeriodFilter => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const monthPart = parts.find((part) => part.type === "month")?.value;
  const yearPart = parts.find((part) => part.type === "year")?.value;

  const month = Number(monthPart);
  const year = Number(yearPart);

  if (!Number.isFinite(month) || !Number.isFinite(year)) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }

  return { month, year };
};

const parsePeriodFilter = (
  monthRaw: string | undefined,
  yearRaw: string | undefined,
): { period: DashboardPeriodFilter; error?: string } => {
  const currentPeriod = getCurrentWibPeriod();

  if (monthRaw === undefined && yearRaw === undefined) {
    return { period: currentPeriod };
  }

  if (monthRaw === undefined || yearRaw === undefined) {
    return {
      period: currentPeriod,
      error: "month dan year harus dikirim bersamaan",
    };
  }

  const month = Number(monthRaw);
  const year = Number(yearRaw);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { period: currentPeriod, error: "month tidak valid (1-12)" };
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { period: currentPeriod, error: "year tidak valid (2000-2100)" };
  }

  return { period: { month, year } };
};

const api = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>();

api.use(
  "/*",
  requireAuth,
  requireRole(["superadmin", "ketua", "bendahara", "pengurus"]),
);

api.get("/summary", async (c) => {
  try {
    const monthRaw = c.req.query("month");
    const yearRaw = c.req.query("year");
    const parsedPeriod = parsePeriodFilter(monthRaw, yearRaw);

    if (parsedPeriod.error) {
      return sendError(c, parsedPeriod.error, 400);
    }

    const data = await dashboardService.getDashboardSummary(c.env.DB, {
      month: parsedPeriod.period.month,
      year: parsedPeriod.period.year,
    });

    return sendSuccess(c, "Berhasil memuat ringkasan dashboard", data);
  } catch (error) {
    console.error("ERROR GET /summary:", error);
    return sendError(c, "Gagal memuat ringkasan dashboard", 500);
  }
});

export default api;
