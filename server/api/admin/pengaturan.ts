import { Hono } from "hono";
import * as kategoriService from "../../services/kategori.ts";
import * as seksiService from "../../services/seksi.ts";
import * as userService from "../../services/user.ts";
import type { UserRole } from "../../services/user.ts";
import { requireAuth, requireRole, type AuthJwtPayload } from "../../middleware/auth.ts";
import { sendSuccess, sendError } from "../../utils/response.ts";

const VALID_ARUS = new Set(["pemasukan", "pengeluaran", "general"]);
const VALID_ROLE = new Set<UserRole>([
  "superadmin",
  "ketua",
  "bendahara",
  "pengurus",
]);

const parsePositiveIntParam = (value: string): number | null => {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
};

const api = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>();

// Menerapkan autentikasi dan otorisasi level file
api.use("/*", requireAuth);
api.use("/*", requireRole(["superadmin", "ketua"]));
api.use("/users", requireRole(["superadmin"]));
api.use("/users/*", requireRole(["superadmin"]));

const actorId = (value: unknown): number => {
  const payload = value && typeof value === "object"
    ? value as AuthJwtPayload
    : {};
  const id = typeof payload.sub === "number" ? payload.sub : payload.id;
  if (typeof id !== "number") throw new Error("Actor ID tidak valid");
  return id;
};

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
    if (typeof arus !== "string" || !VALID_ARUS.has(arus)) {
      return sendError(c, "Jenis arus tidak valid!", 400);
    }

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
    if (typeof arus !== "string" || !VALID_ARUS.has(arus)) {
      return sendError(c, "Jenis arus tidak valid!", 400);
    }

    const kategoriId = parsePositiveIntParam(c.req.param("id"));
    if (kategoriId === null) {
      return sendError(c, "ID kategori tidak valid", 400);
    }

    await kategoriService.updateKategori(
      c.env.DB,
      kategoriId,
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
    const kategoriId = parsePositiveIntParam(c.req.param("id"));
    if (kategoriId === null) {
      return sendError(c, "ID kategori tidak valid", 400);
    }

    await kategoriService.deleteKategori(c.env.DB, kategoriId);
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

    const seksiId = parsePositiveIntParam(c.req.param("id"));
    if (seksiId === null) {
      return sendError(c, "ID seksi tidak valid", 400);
    }

    await seksiService.updateSeksi(
      c.env.DB,
      seksiId,
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
    const seksiId = parsePositiveIntParam(c.req.param("id"));
    if (seksiId === null) {
      return sendError(c, "ID seksi tidak valid", 400);
    }

    await seksiService.deleteSeksi(c.env.DB, seksiId);
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

    if (
      typeof body.role !== "string" ||
      !VALID_ROLE.has(body.role as UserRole)
    ) {
      return sendError(c, "Role tidak valid!", 400);
    }

    await userService.createUser(c.env.DB, actorId(c.get("jwtPayload")), {
      ...body,
      role: body.role as UserRole,
    });
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

    if (typeof role !== "string" || !VALID_ROLE.has(role as UserRole)) {
      return sendError(c, "Role tidak valid!", 400);
    }

    const userId = parsePositiveIntParam(c.req.param("id"));
    if (userId === null) {
      return sendError(c, "ID user tidak valid", 400);
    }

    await userService.updateUser(c.env.DB, actorId(c.get("jwtPayload")), userId, role as UserRole, name);
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

    const userId = parsePositiveIntParam(c.req.param("id"));
    if (userId === null) {
      return sendError(c, "ID user tidak valid", 400);
    }

    await userService.resetPassword(c.env.DB, actorId(c.get("jwtPayload")), userId, password);
    return sendSuccess(c, "Password berhasil di-reset");
  } catch (error) {
    console.error("ERROR PUT /users/password:", error);
    return sendError(c, "Gagal mereset password", 500);
  }
});

api.delete("/users/:id", async (c) => {
  try {
    const userId = parsePositiveIntParam(c.req.param("id"));
    if (userId === null) {
      return sendError(c, "ID user tidak valid", 400);
    }

    await userService.setUserActive(c.env.DB, actorId(c.get("jwtPayload")), userId, false);
    return sendSuccess(c, "Akun berhasil dinonaktifkan");
  } catch (error) {
    if (error instanceof userService.AccountPolicyError) {
      return sendError(c, error.message, error.code === "ACCOUNT_NOT_FOUND" ? 404 : 409);
    }
    console.error("ERROR DELETE /users:", error);
    return sendError(c, "Gagal menonaktifkan akun", 500);
  }
});

api.put("/users/:id/active", async (c) => {
  try {
    const userId = parsePositiveIntParam(c.req.param("id"));
    const body = await c.req.json();
    if (userId === null || typeof body.is_active !== "boolean") {
      return sendError(c, "Status akun tidak valid", 400);
    }
    await userService.setUserActive(c.env.DB, actorId(c.get("jwtPayload")), userId, body.is_active);
    return sendSuccess(c, body.is_active ? "Akun berhasil diaktifkan" : "Akun berhasil dinonaktifkan");
  } catch (error) {
    if (error instanceof userService.AccountPolicyError) {
      return sendError(c, error.message, error.code === "ACCOUNT_NOT_FOUND" ? 404 : 409);
    }
    console.error("ERROR PUT /users/active:", error);
    return sendError(c, "Gagal mengubah status akun", 500);
  }
});

export default api;
