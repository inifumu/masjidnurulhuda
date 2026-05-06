import { Hono } from "hono";
import * as txService from "../../services/transaction";
import * as seksiService from "../../services/seksi";
import * as kategoriService from "../../services/kategori";
import { requireAuth, requireRole } from "../../middleware/auth";
import { sendSuccess, sendError } from "../../utils/response";
import {
  VALID_TIPE,
  parsePositiveInt,
  parseFiniteAmount,
} from "../../utils/transactionValidation";

type JwtPayload = {
  sub?: number;
  id?: number;
  role?: string;
};

const api = new Hono<{
  Bindings: { DB: D1Database; JWT_SECRET: string };
  Variables: { jwtPayload: JwtPayload };
}>();

api.use(
  "/*",
  requireAuth,
  requireRole(["superadmin", "ketua", "bendahara", "pengurus"]),
);

api.get("/master-data", async (c) => {
  try {
    const [seksiRes, kategoriRes] = await Promise.all([
      seksiService.getSeksiList(c.env.DB),
      kategoriService.getKategoriList(c.env.DB),
    ]);
    return sendSuccess(c, "Berhasil memuat master data", {
      sections: seksiRes.results,
      categories: kategoriRes.results,
    });
  } catch (error) {
    return sendError(c, "Gagal memuat master data", 500);
  }
});

api.post("/add-direct", async (c) => {
  try {
    const body = await c.req.json();

    if (
      !body.tipe ||
      body.jumlah === undefined ||
      body.jumlah === null ||
      !body.keterangan ||
      !body.tanggal ||
      body.kategori_id === undefined ||
      body.kategori_id === null
    ) {
      return sendError(c, "Semua kolom utama wajib diisi!", 400);
    }

    if (typeof body.tipe !== "string" || !VALID_TIPE.has(body.tipe)) {
      return sendError(c, "Tipe tidak valid!", 400);
    }

    const nominal = parseFiniteAmount(body.jumlah);
    if (nominal === null) {
      return sendError(c, "Nominal tidak valid!", 400);
    }

    const kategoriId = parsePositiveInt(body.kategori_id);
    if (kategoriId === null) {
      return sendError(c, "Kategori tidak valid!", 400);
    }

    let seksiId: number | null = null;
    if (
      body.seksi_id !== undefined &&
      body.seksi_id !== null &&
      body.seksi_id !== ""
    ) {
      seksiId = parsePositiveInt(body.seksi_id);
      if (seksiId === null) {
        return sendError(c, "Seksi tidak valid!", 400);
      }

      const seksiExists = await seksiService.existsSeksiById(c.env.DB, seksiId);
      if (!seksiExists) {
        return sendError(c, "Seksi tidak ditemukan!", 400);
      }
    }

    const user = c.get("jwtPayload");
    const userId = user.sub ?? user.id;
    if (!userId) return sendError(c, "Sesi tidak valid", 401);

    body.jumlah = nominal;
    body.kategori_id = kategoriId;
    body.seksi_id = seksiId;
    body.status = "approved";

    await txService.createTransaction(c.env.DB, body, userId);
    return sendSuccess(c, "Transaksi Kas Baru berhasil dicatat.", null, 201);
  } catch {
    return sendError(c, "Terjadi kesalahan saat menyimpan transaksi", 500);
  }
});

api.post("/add-proposal", async (c) => {
  try {
    const body = await c.req.json();
    if (
      !body.tipe ||
      body.jumlah === undefined ||
      body.jumlah === null ||
      !body.keterangan ||
      !body.tanggal ||
      body.kategori_id === undefined ||
      body.kategori_id === null ||
      body.seksi_id === undefined ||
      body.seksi_id === null ||
      body.seksi_id === ""
    ) {
      return sendError(
        c,
        "Semua kolom termasuk Seksi Pengaju wajib diisi!",
        400,
      );
    }

    if (typeof body.tipe !== "string" || !VALID_TIPE.has(body.tipe)) {
      return sendError(c, "Tipe tidak valid!", 400);
    }

    const nominal = parseFiniteAmount(body.jumlah);
    if (nominal === null) {
      return sendError(c, "Nominal tidak valid!", 400);
    }

    const kategoriId = parsePositiveInt(body.kategori_id);
    if (kategoriId === null) {
      return sendError(c, "Kategori tidak valid!", 400);
    }

    const seksiId = parsePositiveInt(body.seksi_id);
    if (seksiId === null) {
      return sendError(c, "Seksi tidak valid!", 400);
    }

    const seksiExists = await seksiService.existsSeksiById(c.env.DB, seksiId);
    if (!seksiExists) {
      return sendError(c, "Seksi tidak ditemukan!", 400);
    }

    const user = c.get("jwtPayload");
    const userId = user.sub ?? user.id;
    if (!userId) return sendError(c, "Sesi tidak valid", 401);

    body.jumlah = nominal;
    body.kategori_id = kategoriId;
    body.seksi_id = seksiId;
    body.status = "pending_ketua";

    await txService.createTransaction(c.env.DB, body, userId);
    return sendSuccess(c, "Proposal berhasil diajukan ke Ketua.", null, 201);
  } catch {
    return sendError(c, "Terjadi kesalahan saat mengajukan proposal", 500);
  }
});

api.get("/pending", async (c) => {
  try {
    const user = c.get("jwtPayload");
    const result = await txService.getPendingTransactions(c.env.DB, user);
    return sendSuccess(c, "Berhasil memuat transaksi tertunda", result.results);
  } catch (error) {
    return sendError(c, "Gagal memuat transaksi tertunda", 500);
  }
});

api.get("/list", async (c) => {
  try {
    const user = c.get("jwtPayload");
    const result = await txService.getAllTransactions(c.env.DB, user);
    return sendSuccess(c, "Berhasil memuat daftar transaksi", result.results);
  } catch (error) {
    return sendError(c, "Gagal mengambil data transaksi", 500);
  }
});

// === 🟢 LOGIKA INTI: OTORISASI BERTINGKAT & HACK TANGGAL ===
api.post(
  "/approve/:id",
  requireRole(["superadmin", "ketua", "bendahara"]),
  async (c) => {
    try {
      const id = Number(c.req.param("id"));
      if (!Number.isFinite(id) || id <= 0)
        return sendError(c, "ID transaksi tidak valid", 400);

      const { action } = await c.req.json();
      if (action !== "approve" && action !== "reject")
        return sendError(c, "Aksi tidak valid!", 400);

      const user = c.get("jwtPayload");

      const tx = (await txService.getTransactionById(c.env.DB, id)) as Record<
        string,
        any
      >;
      if (!tx) return sendError(c, "Transaksi tidak ditemukan", 404);

      // 🟢 UPDATE TERBARU: Validasi ketat untuk aksi Reject (Stage-Locked)
      if (action === "reject") {
        if (tx.status === "pending_ketua") {
          if (user.role !== "ketua" && user.role !== "superadmin") {
            return sendError(
              c,
              "Hanya Ketua yang bisa menolak proposal di tahap ini",
              403,
            );
          }
        } else if (tx.status === "pending_bendahara") {
          if (user.role !== "bendahara" && user.role !== "superadmin") {
            return sendError(
              c,
              "Hanya Bendahara yang bisa menolak proposal di tahap ini",
              403,
            );
          }
        } else {
          return sendError(c, "Status proposal tidak valid untuk ditolak", 400);
        }

        await txService.updateStatus(c.env.DB, id, "rejected");
        return sendSuccess(c, "Proposal berhasil ditolak.");
      }

      if (action === "approve") {
        if (tx.status === "pending_ketua") {
          if (user.role !== "ketua" && user.role !== "superadmin") {
            return sendError(
              c,
              "Hanya Ketua yang bisa menyetujui tahap ini",
              403,
            );
          }
          await txService.updateStatus(c.env.DB, id, "pending_bendahara");
          return sendSuccess(c, "Disetujui! Diteruskan ke Bendahara.");
        }

        if (tx.status === "pending_bendahara") {
          if (user.role !== "bendahara" && user.role !== "superadmin") {
            return sendError(
              c,
              "Hanya Bendahara yang bisa mencairkan tahap ini",
              403,
            );
          }

          const hariIniWIB = new Intl.DateTimeFormat("fr-CA", {
            timeZone: "Asia/Jakarta",
          }).format(new Date());

          await txService.updateStatus(c.env.DB, id, "approved", hariIniWIB);
          return sendSuccess(c, "Cair! Transaksi masuk ke laporan hari ini.");
        }

        return sendError(c, "Proposal sudah diproses sebelumnya.", 400);
      }

      return sendError(c, "Aksi tidak valid", 400);
    } catch (error: any) {
      return sendError(
        c,
        error.message || "Gagal memproses persetujuan transaksi",
        400,
      );
    }
  },
);

api.delete(
  "/:id",
  requireRole(["superadmin", "ketua", "bendahara"]),
  async (c) => {
    try {
      const id = Number(c.req.param("id"));
      if (!Number.isFinite(id) || id <= 0)
        return sendError(c, "ID transaksi tidak valid", 400);
      await txService.deleteTransaction(c.env.DB, id);
      return sendSuccess(c, "Transaksi berhasil dihapus");
    } catch (error) {
      return sendError(c, "Gagal menghapus transaksi", 500);
    }
  },
);

export default api;
