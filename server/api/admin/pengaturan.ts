import { Hono } from "hono";
import * as kategoriService from "../../services/kategori";
import * as seksiService from "../../services/seksi";
import * as userService from "../../services/user";
import { requireAuth, requireRole } from "../../middleware/auth";
import { sendSuccess, sendError } from "../../utils/response"; // 🟢 Import Helper

const api = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>();

// Menerapkan autentikasi dan otorisasi level file
api.use("/*", requireAuth);
api.use("/*", requireRole(["superadmin", "ketua"]));

// === ROUTE KATEGORI ===
api.get("/kategori", async (c) => {
  try {
    const result = await kategoriService.getKategoriList(c.env.DB);
    return sendSuccess(c, "Berhasil memuat daftar kategori", result.results);
  } catch (error) {
    console.error("ERROR GET /kategori:", error);
    return sendError(c, "Gagal memuat daftar kategori", 500);
  }
});

api.post("/kategori", async (c) => {
  try {
    // 🟢 UPDATE: Tangkap jenis_arus dari Frontend
    const { nama_kategori, jenis_arus } = await c.req.json();
    if (!nama_kategori) return sendError(c, "Nama kategori wajib diisi!", 400);

    const arus = jenis_arus || "general"; // Fallback default
    await kategoriService.createKategori(c.env.DB, nama_kategori, arus);

    return sendSuccess(c, "Kategori berhasil ditambahkan", null, 201);
  } catch (error) {
    console.error("ERROR POST /kategori:", error);
    return sendError(c, "Gagal menambahkan kategori", 500);
  }
});

api.put("/kategori/:id", async (c) => {
  try {
    // 🟢 UPDATE: Tangkap jenis_arus dari Frontend
    const { nama_kategori, jenis_arus } = await c.req.json();
    if (!nama_kategori) return sendError(c, "Nama kategori wajib diisi!", 400);

    const arus = jenis_arus || "general";
    await kategoriService.updateKategori(
      c.env.DB,
      Number(c.req.param("id")),
      nama_kategori,
      arus,
    );

    return sendSuccess(c, "Kategori berhasil diupdate");
  } catch (error) {
    console.error("ERROR PUT /kategori:", error);
    return sendError(c, "Gagal mengupdate kategori", 500);
  }
});

api.delete("/kategori/:id", async (c) => {
  try {
    await kategoriService.deleteKategori(c.env.DB, Number(c.req.param("id")));
    return sendSuccess(c, "Kategori berhasil dihapus");
  } catch (error) {
    console.error("ERROR DELETE /kategori:", error);
    return sendError(c, "Gagal menghapus kategori", 500);
  }
});

// === ROUTE SEKSI ===
api.get("/seksi", async (c) => {
  try {
    const result = await seksiService.getSeksiList(c.env.DB);
    return sendSuccess(c, "Berhasil memuat daftar seksi", result.results);
  } catch (error) {
    console.error("ERROR GET /seksi:", error);
    return sendError(c, "Gagal memuat daftar seksi", 500);
  }
});

api.post("/seksi", async (c) => {
  try {
    const { nama_seksi, nama_pengurus } = await c.req.json();
    if (!nama_seksi) return sendError(c, "Nama seksi wajib diisi!", 400);

    await seksiService.createSeksi(c.env.DB, nama_seksi, nama_pengurus);
    return sendSuccess(c, "Seksi berhasil ditambahkan", null, 201);
  } catch (error) {
    console.error("ERROR POST /seksi:", error);
    return sendError(c, "Gagal menambahkan seksi", 500);
  }
});

api.put("/seksi/:id", async (c) => {
  try {
    const { nama_seksi, nama_pengurus } = await c.req.json();
    if (!nama_seksi) return sendError(c, "Nama seksi wajib diisi!", 400);

    await seksiService.updateSeksi(
      c.env.DB,
      Number(c.req.param("id")),
      nama_seksi,
      nama_pengurus,
    );
    return sendSuccess(c, "Seksi berhasil diupdate");
  } catch (error) {
    console.error("ERROR PUT /seksi:", error);
    return sendError(c, "Gagal mengupdate seksi", 500);
  }
});

api.delete("/seksi/:id", async (c) => {
  try {
    await seksiService.deleteSeksi(c.env.DB, Number(c.req.param("id")));
    return sendSuccess(c, "Seksi berhasil dihapus");
  } catch (error) {
    console.error("ERROR DELETE /seksi:", error);
    return sendError(c, "Gagal menghapus seksi", 500);
  }
});

// === ROUTE USERS ===
api.get("/users", async (c) => {
  try {
    const result = await userService.getUsers(c.env.DB);
    return sendSuccess(c, "Berhasil memuat daftar akun", result.results);
  } catch (error) {
    console.error("ERROR GET /users:", error);
    return sendError(c, "Gagal memuat daftar akun", 500);
  }
});

api.post("/users", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.email || !body.password || !body.name || !body.role) {
      return sendError(c, "Semua data akun wajib diisi!", 400);
    }

    await userService.createUser(c.env.DB, body);
    return sendSuccess(c, "Akun berhasil dibuat", null, 201);
  } catch (error) {
    console.error("ERROR POST /users:", error);
    return sendError(
      c,
      "Gagal membuat akun, pastikan email belum terdaftar",
      500,
    );
  }
});

api.put("/users/:id", async (c) => {
  try {
    const { role, name } = await c.req.json();
    if (!role || !name) return sendError(c, "Nama dan Role wajib diisi!", 400);

    await userService.updateUserRole(
      c.env.DB,
      Number(c.req.param("id")),
      role,
      name,
    );
    return sendSuccess(c, "Akun berhasil diupdate");
  } catch (error) {
    console.error("ERROR PUT /users:", error);
    return sendError(c, "Gagal mengupdate akun", 500);
  }
});

api.put("/users/:id/password", async (c) => {
  try {
    const { password } = await c.req.json();
    if (!password || password.length < 6) {
      return sendError(c, "Password baru minimal 6 karakter!", 400);
    }

    await userService.resetPassword(
      c.env.DB,
      Number(c.req.param("id")),
      password,
    );
    return sendSuccess(c, "Password berhasil di-reset");
  } catch (error) {
    console.error("ERROR PUT /users/password:", error);
    return sendError(c, "Gagal mereset password", 500);
  }
});

api.delete("/users/:id", async (c) => {
  try {
    await userService.deleteUser(c.env.DB, Number(c.req.param("id")));
    return sendSuccess(c, "Akun berhasil dihapus");
  } catch (error) {
    console.error("ERROR DELETE /users:", error);
    return sendError(c, "Gagal menghapus akun", 500);
  }
});

export default api;
