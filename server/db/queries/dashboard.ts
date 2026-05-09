type DashboardPeriodFilter = {
  month: number;
  year: number;
};

type KasSummaryRow = {
  saldoAwal: number | null;
  totalPemasukan: number | null;
  totalPengeluaran: number | null;
};

const toSqlDate = (year: number, month: number): string => {
  const monthPadded = String(month).padStart(2, "0");
  return `${year}-${monthPadded}-01`;
};

const getNextMonthPeriod = (
  period: DashboardPeriodFilter,
): DashboardPeriodFilter => {
  if (period.month === 12) {
    return { month: 1, year: period.year + 1 };
  }

  return { month: period.month + 1, year: period.year };
};

export const getKasSummary = async (
  db: D1Database,
  period: DashboardPeriodFilter,
) => {
  const periodStart = toSqlDate(period.year, period.month);
  const nextPeriod = getNextMonthPeriod(period);
  const nextPeriodStart = toSqlDate(nextPeriod.year, nextPeriod.month);

  const summary = await db
    .prepare(
      `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN tanggal < ?1
                THEN CASE WHEN tipe = 'pemasukan' THEN jumlah ELSE -jumlah END
                ELSE 0
              END
            ),
            0
          ) AS saldoAwal,
          COALESCE(
            SUM(
              CASE
                WHEN tanggal >= ?1 AND tanggal < ?2 AND tipe = 'pemasukan'
                THEN jumlah
                ELSE 0
              END
            ),
            0
          ) AS totalPemasukan,
          COALESCE(
            SUM(
              CASE
                WHEN tanggal >= ?1 AND tanggal < ?2 AND tipe = 'pengeluaran'
                THEN jumlah
                ELSE 0
              END
            ),
            0
          ) AS totalPengeluaran
        FROM kas_masjid
        WHERE status = 'approved'
      `,
    )
    .bind(periodStart, nextPeriodStart)
    .first<KasSummaryRow>();

  const saldoAwal = summary?.saldoAwal ?? 0;
  const totalPemasukan = summary?.totalPemasukan ?? 0;
  const totalPengeluaran = summary?.totalPengeluaran ?? 0;
  const saldoAkhir = saldoAwal + totalPemasukan - totalPengeluaran;

  return { saldoAwal, totalPemasukan, totalPengeluaran, saldoAkhir };
};
