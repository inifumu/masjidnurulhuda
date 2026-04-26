import { Hono } from "hono";
import { sendSuccess, sendError } from "../../utils/response"; // 🟢 Import Helper

const api = new Hono<{ Bindings: { DB: D1Database } }>();

// Endpoint: GET /api/public/kas/summary
api.get("/summary", async (c) => {
  try {
    const query = `
      SELECT 
        SUM(CASE WHEN tipe = 'pemasukan' THEN jumlah ELSE -jumlah END) as total_saldo,
        SUM(CASE WHEN tipe = 'pemasukan' AND strftime('%Y-%m', tanggal) = strftime('%Y-%m', 'now', 'localtime') THEN jumlah ELSE 0 END) as pemasukan_bulan_ini,
        SUM(CASE WHEN tipe = 'pengeluaran' AND strftime('%Y-%m', tanggal) = strftime('%Y-%m', 'now', 'localtime') THEN jumlah ELSE 0 END) as pengeluaran_bulan_ini
      FROM kas_masjid 
      WHERE status = 'approved'
    `;

    const result = await c.env.DB.prepare(query).first();

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
