import { onMounted, ref } from "vue";
import { jadwalService, type JadwalApiData } from "../../../services/public/home/jadwalService";

const CACHE_KEY = "jadwal_sholat_cache";

type WaktuSalat = { nama: string; waktu: string };
type JadwalCache = { date: string; lokasi: string; jadwal: WaktuSalat[] };
export type JadwalSource = "live" | "cache" | "stale" | "unavailable";

const isWaktuSalat = (value: unknown): value is WaktuSalat => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.nama === "string" && typeof item.waktu === "string";
};

const parseCachedData = (raw: string | null): JadwalCache | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<JadwalCache>;
    if (
      typeof value.date !== "string" ||
      typeof value.lokasi !== "string" ||
      !Array.isArray(value.jadwal) ||
      !value.jadwal.every(isWaktuSalat)
    ) return null;
    return value as JadwalCache;
  } catch {
    return null;
  }
};

const formatJadwal = (data: JadwalApiData): WaktuSalat[] => [
  { nama: "Subuh", waktu: data.jadwal.subuh },
  { nama: "Dzuhur", waktu: data.jadwal.dzuhur },
  { nama: "Ashar", waktu: data.jadwal.ashar },
  { nama: "Maghrib", waktu: data.jadwal.maghrib },
  { nama: "Isya", waktu: data.jadwal.isya },
];

const getTodayWib = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export function useJadwal() {
  const lokasiMasjid = ref("");
  const jadwal = ref<WaktuSalat[]>([]);
  const isLoading = ref(true);
  const errorMessage = ref("");
  const source = ref<JadwalSource>("unavailable");

  const loadJadwal = async () => {
    isLoading.value = true;
    errorMessage.value = "";
    const today = getTodayWib();
    let cached: JadwalCache | null = null;
    try {
      cached = parseCachedData(localStorage.getItem(CACHE_KEY));
    } catch {
      cached = null;
    }

    if (cached?.date === today) {
      lokasiMasjid.value = cached.lokasi;
      jadwal.value = cached.jadwal;
      source.value = "cache";
      isLoading.value = false;
      return;
    }

    try {
      const result = await jadwalService.fetchJadwalToday("surakarta");
      lokasiMasjid.value = result.data.lokasi;
      jadwal.value = formatJadwal(result.data);
      source.value = "live";
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, lokasi: lokasiMasjid.value, jadwal: jadwal.value }));
      } catch {
        // Cache bersifat best-effort; data live tetap valid bila storage ditolak browser.
      }
    } catch {
      if (cached) {
        lokasiMasjid.value = cached.lokasi;
        jadwal.value = cached.jadwal;
        source.value = "stale";
        errorMessage.value = "Penyedia jadwal sedang tidak dapat dijangkau. Waktu yang tampil berasal dari cache sebelumnya dan perlu dikonfirmasi kembali.";
      } else {
        lokasiMasjid.value = "";
        jadwal.value = [];
        source.value = "unavailable";
        errorMessage.value = "Jadwal salat belum dapat dimuat dari penyedia saat ini.";
      }
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(loadJadwal);
  return { lokasiMasjid, jadwal, isLoading, errorMessage, source, loadJadwal };
}
