import { Hono } from "hono";
import { sendSuccess, sendError } from "../../utils/response"; // 🟢 Import Helper

const api = new Hono();

type KotaSearchResponse = {
  status: boolean;
  data?: Array<{ id: string }>;
};

type JadwalTodayResponse = {
  status: boolean;
  data: {
    lokasi: string;
    jadwal: Record<string, string>;
  };
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

// 🟢 HELPER: Fetch dengan Timeout dan Auto-Retry
const fetchWithRetry = async <T>(
  url: string,
  retries = 1,
  timeoutMs = 3000,
): Promise<T> => {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return (await res.json()) as T;
    } catch (err: unknown) {
      clearTimeout(id);
      console.warn(
        `[Retry ${i}/${retries}] Gagal fetch ${url}: ${getErrorMessage(err)}`,
      );
      if (i === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Gagal fetch setelah retry");
};

api.get("/today", async (c) => {
  try {
    const kota = c.req.query("kota") || "surakarta";
    const encodedKota = encodeURIComponent(kota.trim());
    const searchData = await fetchWithRetry<KotaSearchResponse>(
      `https://api.myquran.com/v2/sholat/kota/cari/${encodedKota}`,
    );

    if (
      !searchData.status ||
      !searchData.data ||
      searchData.data.length === 0
    ) {
      return sendError(c, "Kota tidak ditemukan", 404);
    }

    const idKota = searchData.data[0].id;
    const date = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const jadwalData = await fetchWithRetry<JadwalTodayResponse>(
      `https://api.myquran.com/v2/sholat/jadwal/${idKota}/${year}/${month}/${day}`,
    );

    if (!jadwalData.status) {
      return sendError(c, "Gagal memuat jadwal dari Kemenag", 500);
    }

    // 🟢 Set Cache-Control sebelum melempar response sukses
    c.header("Cache-Control", "public, max-age=3600, s-maxage=3600");

    return sendSuccess(c, "Berhasil memuat jadwal sholat", {
      lokasi: jadwalData.data.lokasi,
      jadwal: jadwalData.data.jadwal,
    });
  } catch (error: unknown) {
    console.error("Jadwal Proxy Error:", getErrorMessage(error));
    return sendError(c, "Gagal terhubung ke penyedia jadwal", 500);
  }
});

export default api;
