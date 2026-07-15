export type KasSummary = {
  total_saldo: number;
  pemasukan_bulan_ini: number;
  pengeluaran_bulan_ini: number;
};

type KasSummaryResponse = { status: "success"; data: KasSummary };

export const kasSummaryService = {
  async fetchSummary(): Promise<KasSummary> {
    const response = await fetch("/api/public/kas/summary");
    if (!response.ok) throw new Error(`Kas summary request failed: ${response.status}`);
    const json = (await response.json()) as Partial<KasSummaryResponse>;
    const data = json.data;
    if (
      json.status !== "success" ||
      !data ||
      !Number.isFinite(data.total_saldo) ||
      !Number.isFinite(data.pemasukan_bulan_ini) ||
      !Number.isFinite(data.pengeluaran_bulan_ini)
    ) throw new Error("Invalid kas summary response");
    return data;
  },
};
