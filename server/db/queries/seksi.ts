export const getAllSeksi = async (db: D1Database) => {
  const { results } = await db.prepare("SELECT * FROM seksi_pengurus").all();
  return results;
};
