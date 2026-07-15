export type JadwalApiData = {
  lokasi: string;
  jadwal: { subuh: string; dzuhur: string; ashar: string; maghrib: string; isya: string };
};

type JadwalApiResponse = { status: "success"; data: JadwalApiData };

export const jadwalService = {
  async fetchJadwalToday(namaKota = "surakarta"): Promise<JadwalApiResponse> {
    const response = await fetch(`/api/public/jadwal/today?kota=${encodeURIComponent(namaKota)}`);
    if (!response.ok) throw new Error(`Jadwal request failed: ${response.status}`);
    const json = (await response.json()) as Partial<JadwalApiResponse>;
    const data = json.data;
    const times = data?.jadwal;
    if (
      json.status !== "success" ||
      typeof data?.lokasi !== "string" ||
      !times ||
      ![times.subuh, times.dzuhur, times.ashar, times.maghrib, times.isya].every(
        (time) => typeof time === "string" && time.length > 0,
      )
    ) throw new Error("Invalid jadwal response");
    return { status: "success", data };
  },
};
