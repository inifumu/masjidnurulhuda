import { Hono } from "hono";
import * as dashboardService from "../../services/dashboard";
import { requireAuth, requireRole } from "../../middleware/auth";
import { sendSuccess, sendError } from "../../utils/response";
import { getCurrentWibPeriod, parseBusinessPeriod } from "../../../shared/contracts/index.ts";

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
    const parsedPeriod = monthRaw === undefined && yearRaw === undefined
      ? { ok: true as const, value: getCurrentWibPeriod() }
      : parseBusinessPeriod(monthRaw, yearRaw);
    if (!parsedPeriod.ok) return sendError(c, "Periode tidak valid.", 400, parsedPeriod.fields, "VALIDATION_ERROR");

    const data = await dashboardService.getDashboardSummary(c.env.DB, parsedPeriod.value);

    return sendSuccess(c, "Berhasil memuat ringkasan dashboard", data);
  } catch (error) {
    console.error("ERROR GET /summary:", error);
    return sendError(c, "Gagal memuat ringkasan dashboard", 500);
  }
});

export default api;
