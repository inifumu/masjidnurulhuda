// server/services/kategori.ts

export const getKategoriList = async (db: D1Database) => {
  return await db.prepare("SELECT * FROM kategori_kas ORDER BY id ASC").all();
};

// 🟢 UPDATE: Tambahkan parameter jenisArus dan masukkan ke query INSERT
export const createKategori = async (
  db: D1Database,
  namaKategori: string,
  jenisArus: string,
) => {
  return await db
    .prepare(
      "INSERT INTO kategori_kas (nama_kategori, jenis_arus) VALUES (?, ?)",
    )
    .bind(namaKategori, jenisArus)
    .run();
};

// 🟢 UPDATE: Tambahkan parameter jenisArus dan masukkan ke query UPDATE
export const updateKategori = async (
  db: D1Database,
  id: number,
  namaKategori: string,
  jenisArus: string,
) => {
  return await db
    .prepare(
      "UPDATE kategori_kas SET nama_kategori = ?, jenis_arus = ? WHERE id = ?",
    )
    .bind(namaKategori, jenisArus, id)
    .run();
};

export const deleteKategori = async (db: D1Database, id: number) => {
  return await db
    .prepare("DELETE FROM kategori_kas WHERE id = ?")
    .bind(id)
    .run();
};
