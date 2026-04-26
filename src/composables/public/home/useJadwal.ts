import { ref, onMounted } from "vue";
import { jadwalService } from "../../../services/public/home/jadwalService";

// Konstanta untuk kunci LocalStorage
const CACHE_KEY = "jadwal_sholat_cache";

export function useJadwal() {
  const lokasiMasjid = ref("Mencari lokasi...");
  const jadwal = ref([
    { nama: "Subuh", waktu: "..." },
    { nama: "Dzuhur", waktu: "..." },
    { nama: "Ashar", waktu: "..." },
    { nama: "Maghrib", waktu: "..." },
    { nama: "Isya", waktu: "..." },
  ]);

  const parseCachedData = (raw: string | null) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Cache jadwal rusak, akan diabaikan.");
      return null;
    }
  };

  const loadJadwal = async () => {
    // 1. Dapatkan tanggal hari ini (Format YYYY-MM-DD)
    const date = new Date();
    const todayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    // 2. Cek LocalStorage terlebih dahulu (CACHE LOKAL INSTAN)
    const cachedDataStr = localStorage.getItem(CACHE_KEY);
    const cachedData = parseCachedData(cachedDataStr);
    if (cachedData) {
      // Jika data cache adalah untuk hari ini, langsung pakai & berhenti di sini!
      if (cachedData.date === todayStr) {
        lokasiMasjid.value = cachedData.lokasi;
        jadwal.value = cachedData.jadwal;
        return;
      }
    }

    // 3. Jika belum ada cache untuk hari ini, minta ke Backend (BFF)
    try {
      const result = await jadwalService.fetchJadwalToday("surakarta");

      if (result.status === "success") {
        lokasiMasjid.value = result.data.lokasi;
        const dataWaktu = result.data.jadwal;

        const formatJadwal = [
          { nama: "Subuh", waktu: dataWaktu.subuh },
          { nama: "Dzuhur", waktu: dataWaktu.dzuhur },
          { nama: "Ashar", waktu: dataWaktu.ashar },
          { nama: "Maghrib", waktu: dataWaktu.maghrib },
          { nama: "Isya", waktu: dataWaktu.isya },
        ];

        jadwal.value = formatJadwal;

        // 🟢 SIMPAN KE LOCALSTORAGE (OVERWRITE CACHE LAMA)
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            date: todayStr,
            lokasi: result.data.lokasi,
            jadwal: formatJadwal,
          }),
        );
      } else {
        throw new Error("Respons API tidak sukses");
      }
    } catch (error) {
      console.error("Gagal memuat jadwal dari server:", error);

      // 🔴 FALLBACK: Jika internet mati atau server hancur, cek apakah ada sisa cache lama
      const oldCache = parseCachedData(cachedDataStr);
      if (oldCache) {
        lokasiMasjid.value = `${oldCache.lokasi} (Mode Offline)`;
        jadwal.value = oldCache.jadwal;
      } else {
        lokasiMasjid.value = "Gagal memuat jadwal";
      }
    }
  };

  onMounted(() => {
    loadJadwal();
  });

  return { lokasiMasjid, jadwal };
}
