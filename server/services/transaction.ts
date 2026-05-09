/**
 * Tujuan: Service transaksi kas (create, list, approval, delete) dengan scoping RBAC.
 * Caller: Route admin transaksi (`server/api/admin/transaction.ts`).
 * Dependensi: Cloudflare D1 (`DB`) dan tabel `kas_masjid`, `kategori_kas`, `seksi_pengurus`.
 * Main Functions: `createTransaction`, `getPendingTransactions`, `getAllTransactions`, `updateStatus`, `deleteTransaction`.
 * Side Effects: Mutasi data transaksi + query list berbasis role/period/filter.
 */
type TransactionType = "pemasukan" | "pengeluaran";
type SqlParam = string | number | null;

type TransactionStatus =
  | "pending_ketua"
  | "pending_bendahara"
  | "approved"
  | "rejected";

export interface TransactionPayload {
  tipe: TransactionType;
  jumlah: number;
  keterangan: string;
  tanggal: string;
  kategori_id: number;
  periode_id?: number | null;
  seksi_id?: number | null;
  metode?: string | null;
  status?: TransactionStatus;
}

export interface TransactionUserScope {
  sub?: number;
  id?: number;
  role?: string;
}

export const getTransactionById = async (db: D1Database, id: number) => {
  return await db
    .prepare("SELECT * FROM kas_masjid WHERE id = ?")
    .bind(id)
    .first();
};

export const createTransaction = async (
  db: D1Database,
  data: TransactionPayload,
  userId: number,
) => {
  const {
    tipe,
    jumlah,
    keterangan,
    tanggal,
    kategori_id,
    periode_id,
    seksi_id,
    metode,
    status,
  } = data;

  const finalStatus = status || "pending_ketua";

  return await db
    .prepare(
      `
      INSERT INTO kas_masjid 
      (tipe, jumlah, keterangan, tanggal, kategori_id, periode_id, seksi_id, metode_pembayaran, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .bind(
      tipe ?? null,
      jumlah ?? null,
      keterangan ?? null,
      tanggal ?? null,
      kategori_id ?? null,
      periode_id ?? null,
      seksi_id ?? null,
      metode ?? null,
      userId,
      finalStatus,
    )
    .run();
};

export const getPendingTransactions = async (
  db: D1Database,
  user: TransactionUserScope,
) => {
  // 🟢 UPDATE: Tambahkan ALIAS as kategori dan as seksi agar sama persis dengan query list
  let baseQuery = `
    SELECT t.*, k.nama_kategori as kategori, s.nama_seksi as seksi 
    FROM kas_masjid t
    JOIN kategori_kas k ON t.kategori_id = k.id
    LEFT JOIN seksi_pengurus s ON t.seksi_id = s.id
    WHERE t.status IN ('pending_ketua', 'pending_bendahara', 'rejected')
  `;

  if (user.role === "pengurus") {
    const userId = user.sub || user.id;
    baseQuery += ` AND t.created_by = ? ORDER BY t.created_at DESC`;
    return await db.prepare(baseQuery).bind(userId).all();
  }

  baseQuery += ` ORDER BY t.created_at DESC`;
  return await db.prepare(baseQuery).all();
};

export const updateStatus = async (
  db: D1Database,
  id: number,
  newStatus: TransactionStatus,
  accDate?: string,
) => {
  // 🟢 1. Ambil state saat ini untuk validasi Race Condition (POIN 2)
  const current = await db
    .prepare("SELECT status FROM kas_masjid WHERE id = ?")
    .bind(id)
    .first();
  if (!current) throw new Error("Transaksi tidak ditemukan.");

  const currentStatus = current.status as string;

  // 🟢 2. Validasi Alur Logika (Cegah lompat status atau dobel klik)
  if (newStatus === "pending_bendahara" && currentStatus !== "pending_ketua") {
    throw new Error("Gagal! Proposal ini sudah tidak ada di antrean Ketua.");
  }
  if (newStatus === "approved" && currentStatus !== "pending_bendahara") {
    throw new Error(
      "Gagal! Proposal ini sudah tidak ada di antrean Bendahara.",
    );
  }
  if (newStatus === "rejected" && currentStatus === "approved") {
    throw new Error("Gagal! Tidak bisa menolak proposal yang sudah cair.");
  }

  // 🟢 3. Rangkai Query Update dengan aman
  let query = "UPDATE kas_masjid SET status = ?";
  const params: SqlParam[] = [newStatus];

  // 🟢 4. Audit Trail (POIN 5) - Catat kapan dana benar-benar dicairkan
  if (newStatus === "approved") {
    query += ", approved_at = CURRENT_TIMESTAMP";

    // Jika bendahara mengubah tanggal untuk laporan buku kas, biarkan ditimpa
    // Karena sekarang kita punya approved_at dan created_at sebagai backup jejak aslinya
    if (accDate) {
      query += ", tanggal = ?";
      params.push(accDate);
    }
  }

  // 🟢 5. Eksekusi Optimistic Locking
  query += " WHERE id = ? AND status = ?";
  params.push(id, currentStatus);

  const result = await db
    .prepare(query)
    .bind(...params)
    .run();

  if (result.meta.changes === 0) {
    throw new Error(
      "Gagal memproses! Data mungkin telah diubah oleh pengguna lain.",
    );
  }

  return result;
};

type TransactionPeriodFilter = {
  month: number;
  year: number;
};

export type TransactionListFilter = {
  tipe?: TransactionType;
  kategoriId?: number;
};

export const getAllTransactions = async (
  db: D1Database,
  user: TransactionUserScope,
  period: TransactionPeriodFilter,
  filters: TransactionListFilter = {},
) => {
  let baseQuery = `
    SELECT 
      t.*, 
      k.nama_kategori as kategori, 
      s.nama_seksi as seksi
    FROM kas_masjid t
    JOIN kategori_kas k ON t.kategori_id = k.id
    LEFT JOIN seksi_pengurus s ON t.seksi_id = s.id
    WHERE t.periode_id IS NULL
      AND CAST(strftime('%m', t.tanggal) AS INTEGER) = ?
      AND CAST(strftime('%Y', t.tanggal) AS INTEGER) = ?
  `;

  const baseParams: SqlParam[] = [period.month, period.year];

  if (filters.tipe) {
    baseQuery += ` AND t.tipe = ?`;
    baseParams.push(filters.tipe);
  }

  if (filters.kategoriId !== undefined) {
    baseQuery += ` AND t.kategori_id = ?`;
    baseParams.push(filters.kategoriId);
  }

  if (user && user.role === "pengurus") {
    const userId = user.sub || user.id;
    if (!userId) {
      baseQuery += ` AND t.status = 'approved' ORDER BY t.tanggal DESC, t.created_at DESC`;
      return await db
        .prepare(baseQuery)
        .bind(...baseParams)
        .all();
    }

    baseQuery += ` AND (t.status = 'approved' OR t.created_by = ?) ORDER BY t.tanggal DESC, t.created_at DESC`;
    return await db
      .prepare(baseQuery)
      .bind(...baseParams, userId)
      .all();
  }

  baseQuery += ` ORDER BY t.tanggal DESC, t.created_at DESC`;
  return await db
    .prepare(baseQuery)
    .bind(...baseParams)
    .all();
};

export const deleteTransaction = async (db: D1Database, id: number) => {
  return await db.prepare("DELETE FROM kas_masjid WHERE id = ?").bind(id).run();
};
