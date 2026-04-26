export const getKasSummary = async (db: D1Database) => {
  // Hanya hitung PEMASUKAN yang statusnya sudah 'approved'
  const masuk: any = await db
    .prepare(
      "SELECT SUM(jumlah) as total FROM kas_masjid WHERE tipe = 'pemasukan' AND status = 'approved'",
    )
    .first();

  // Hanya hitung PENGELUARAN yang statusnya sudah 'approved'
  const keluar: any = await db
    .prepare(
      "SELECT SUM(jumlah) as total FROM kas_masjid WHERE tipe = 'pengeluaran' AND status = 'approved'",
    )
    .first();

  const totalPemasukan = masuk?.total || 0;
  const totalPengeluaran = keluar?.total || 0;
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  return { totalPemasukan, totalPengeluaran, saldoAkhir };
};
