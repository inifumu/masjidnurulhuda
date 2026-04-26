export const jadwalService = {
  async fetchJadwalToday(namaKota: string = "surakarta") {
    // Cukup panggil API internal Hono kita, super bersih!
    const response = await fetch(`/api/public/jadwal/today?kota=${namaKota}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
};
