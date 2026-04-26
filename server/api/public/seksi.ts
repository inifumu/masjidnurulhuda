import { Hono } from "hono";
import * as seksiService from "../../services/seksi";
import { sendSuccess, sendError } from "../../utils/response"; // 🟢 Import Helper

const api = new Hono<{ Bindings: { DB: D1Database } }>();

api.get("/", async (c) => {
  try {
    const data = await seksiService.getSeksiList(c.env.DB);
    // D1 biasanya membungkus array di dalam property .results
    return sendSuccess(c, "Berhasil memuat daftar seksi", data.results || data);
  } catch (error) {
    console.error("Public Seksi API Error:", error);
    return sendError(c, "Gagal memuat daftar seksi", 500);
  }
});

export default api;
