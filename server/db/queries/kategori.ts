export const getAllKategori = async (db: D1Database) => {
  const { results } = await db
    .prepare("SELECT id, nama_kategori as name, tipe FROM kategori_kas")
    .all();
  return results;
};
