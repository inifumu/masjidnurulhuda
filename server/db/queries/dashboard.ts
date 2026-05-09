type DashboardPeriodFilter = {
  month: number;
  year: number;
};

type KasSummaryRow = {
  totalPemasukan: number | null;
  totalPengeluaran: number | null;
};

export const getKasSummary = async (
  db: D1Database,
  period: DashboardPeriodFilter,
) => {
  const monthPadded = String(period.month).padStart(2, "0");
  const yearText = String(period.year);

  const summary = await db
    .prepare(
      `
        SELECT
          SUM(CASE WHEN tipe = 'pemasukan' THEN jumlah ELSE 0 END) AS totalPemasukan,
          SUM(CASE WHEN tipe = 'pengeluaran' THEN jumlah ELSE 0 END) AS totalPengeluaran
        FROM kas_masjid
        WHERE status = 'approved'
          AND strftime('%m', tanggal) = ?1
          AND strftime('%Y', tanggal) = ?2
      `,
    )
    .bind(monthPadded, yearText)
    .first<KasSummaryRow>();

  const totalPemasukan = summary?.totalPemasukan ?? 0;
  const totalPengeluaran = summary?.totalPengeluaran ?? 0;
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  return { totalPemasukan, totalPengeluaran, saldoAkhir };
};
