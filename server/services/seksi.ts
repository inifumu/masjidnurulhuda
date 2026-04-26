// server/services/seksi.ts

export const getSeksiList = async (db: D1Database) => {
  return await db.prepare("SELECT * FROM seksi_pengurus ORDER BY id ASC").all();
};

export const createSeksi = async (
  db: D1Database,
  namaSeksi: string,
  namaPengurus: string,
) => {
  return await db
    .prepare(
      "INSERT INTO seksi_pengurus (nama_seksi, nama_pengurus) VALUES (?, ?)",
    )
    .bind(namaSeksi, namaPengurus || null)
    .run();
};

export const updateSeksi = async (
  db: D1Database,
  id: number,
  namaSeksi: string,
  namaPengurus: string,
) => {
  return await db
    .prepare(
      "UPDATE seksi_pengurus SET nama_seksi = ?, nama_pengurus = ? WHERE id = ?",
    )
    .bind(namaSeksi, namaPengurus || null, id)
    .run();
};

export const deleteSeksi = async (db: D1Database, id: number) => {
  return await db
    .prepare("DELETE FROM seksi_pengurus WHERE id = ?")
    .bind(id)
    .run();
};
