export const createTransaction = async (
  db: D1Database,
  data: any,
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

  const finalStatus = status || "pending";

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
      userId ?? null, // 🟢 Sekarang userId pasti ada isinya!
      finalStatus,
    )
    .run();
};

export const getPendingTransactions = async (db: D1Database, user: any) => {
  let baseQuery = `
    SELECT t.*, k.nama_kategori, s.nama_seksi 
    FROM kas_masjid t
    JOIN kategori_kas k ON t.kategori_id = k.id
    LEFT JOIN seksi_pengurus s ON t.seksi_id = s.id
    WHERE t.status = 'pending'
  `;

  // 🟢 SATPAM DATABASE dengan Jaring Ganda
  if (user.role === "pengurus") {
    const userId = user.sub || user.id; // Tangkap identitasnya
    baseQuery += ` AND t.created_by = ? ORDER BY t.created_at DESC`;
    return await db.prepare(baseQuery).bind(userId).all();
  }

  baseQuery += ` ORDER BY t.created_at DESC`;
  return await db.prepare(baseQuery).all();
};

export const updateStatus = async (
  db: D1Database,
  id: number,
  status: "approved" | "rejected",
) => {
  return await db
    .prepare("UPDATE kas_masjid SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();
};

export const getAllTransactions = async (db: D1Database, user: any) => {
  let baseQuery = `
    SELECT 
      t.*, 
      k.nama_kategori as kategori, 
      s.nama_seksi as seksi
    FROM kas_masjid t
    JOIN kategori_kas k ON t.kategori_id = k.id
    LEFT JOIN seksi_pengurus s ON t.seksi_id = s.id
    WHERE t.periode_id IS NULL 
  `;

  // 🟢 SATPAM DATA SCOPING dengan Jaring Ganda
  if (user && user.role === "pengurus") {
    const userId = user.sub || user.id; // Tangkap identitasnya
    if (!userId) {
      // Safety fallback: jika token user tidak membawa id yang valid,
      // jangan tampilkan data personal agar tidak terjadi kebocoran lintas akun.
      baseQuery += ` AND t.status = 'approved' ORDER BY t.tanggal DESC, t.created_at DESC`;
      return await db.prepare(baseQuery).all();
    }
    // Tampilkan yang 'approved' ATAU yang dia buat sendiri
    baseQuery += ` AND (t.status = 'approved' OR t.created_by = ?) ORDER BY t.tanggal DESC, t.created_at DESC`;
    return await db.prepare(baseQuery).bind(userId).all();
  }

  // Jika Superadmin/Ketua: Tampilkan semua
  baseQuery += ` ORDER BY t.tanggal DESC, t.created_at DESC`;
  return await db.prepare(baseQuery).all();
};

export const deleteTransaction = async (db: D1Database, id: number) => {
  return await db.prepare("DELETE FROM kas_masjid WHERE id = ?").bind(id).run();
};
