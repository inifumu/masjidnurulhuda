import { Hono } from "hono";
import { sendSuccess, sendError } from "../../utils/response.ts";

const api = new Hono<{ Bindings: { DB: D1Database } }>();

export const getWibMonthBounds = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return {
    periodStart: `${year}-${String(month).padStart(2, "0")}-01`,
    nextPeriodStart: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
};

// Endpoint: GET /api/public/kas/summary
api.get("/summary", async (c) => {
  try {
    const { periodStart, nextPeriodStart } = getWibMonthBounds();
    const query = `
      SELECT 
        SUM(CASE WHEN tipe = 'pemasukan' THEN jumlah ELSE -jumlah END) as total_saldo,
        SUM(CASE WHEN tipe = 'pemasukan' AND tanggal >= ?1 AND tanggal < ?2 THEN jumlah ELSE 0 END) as pemasukan_bulan_ini,
        SUM(CASE WHEN tipe = 'pengeluaran' AND tanggal >= ?1 AND tanggal < ?2 THEN jumlah ELSE 0 END) as pengeluaran_bulan_ini
      FROM kas_masjid 
      WHERE status = 'approved'
    `;

    const result = await c.env.DB.prepare(query).bind(periodStart, nextPeriodStart).first();

    return sendSuccess(c, "Berhasil memuat ringkasan kas", {
      total_saldo: result?.total_saldo || 0,
      pemasukan_bulan_ini: result?.pemasukan_bulan_ini || 0,
      pengeluaran_bulan_ini: result?.pengeluaran_bulan_ini || 0,
    });
  } catch (error) {
    console.error("Public Kas API Error:", error);
    return sendError(c, "Gagal memuat data kas", 500);
  }
});

export default api;
