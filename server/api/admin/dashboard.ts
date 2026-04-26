import { Hono } from "hono";
import * as dashboardService from "../../services/dashboard";
import { requireAuth, requireRole } from "../../middleware/auth"; // 🟢 Tambahkan requireRole
import { sendSuccess, sendError } from "../../utils/response";

const api = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>();

// 🟢 LOCK: Pasang allowlist eksplisit untuk dashboard
api.use("/*", requireAuth, requireRole(["superadmin", "ketua", "pengurus"]));

api.get("/summary", async (c) => {
  try {
    const data = await dashboardService.getDashboardSummary(c.env.DB);
    // 🟢 Ganti ke Helper Success
    return sendSuccess(c, "Berhasil memuat ringkasan dashboard", data);
  } catch (error) {
    console.error("ERROR GET /summary:", error);
    // 🔴 Ganti ke Helper Error (Jangan kembalikan saldo 0 kalau error!)
    return sendError(c, "Gagal memuat ringkasan dashboard", 500);
  }
});

export default api;
