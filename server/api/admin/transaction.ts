import { Hono } from "hono";
import * as txService from "../../services/transaction";
import * as seksiService from "../../services/seksi";
import * as kategoriService from "../../services/kategori";
import { requireAuth, requireRole } from "../../middleware/auth";
import { sendSuccess, sendError } from "../../utils/response";

type JwtPayload = {
  sub?: number;
  id?: number;
  role?: string;
};

const api = new Hono<{
  Bindings: { DB: D1Database; JWT_SECRET: string };
  Variables: { jwtPayload: JwtPayload };
}>();

// Autentikasi dasar DAN Allowlist Role untuk seluruh endpoint transaksi
api.use("/*", requireAuth, requireRole(["superadmin", "ketua", "pengurus"]));

// === MASTER DATA ===
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
    console.error("ERROR GET /master-data:", error);
    return sendError(c, "Gagal memuat master data", 500);
  }
});

// === 1. TRANSAKSI JALUR CEPAT (KAS BARU) ===
api.post("/add-direct", async (c) => {
  try {
    const body = await c.req.json();

    if (
      !body.tipe ||
      !body.jumlah ||
      !body.keterangan ||
      !body.tanggal ||
      !body.kategori_id
    ) {
      return sendError(c, "Semua kolom utama wajib diisi!", 400);
    }

    const nominal = Number(body.jumlah);
    if (isNaN(nominal) || nominal <= 0) {
      return sendError(
        c,
        "Jumlah nominal harus berupa angka lebih besar dari 0!",
        400,
      );
    }
    body.jumlah = nominal;

    if (!["pemasukan", "pengeluaran"].includes(body.tipe)) {
      return sendError(c, "Tipe transaksi tidak valid!", 400);
    }

    body.keterangan = String(body.keterangan).trim();
    if (body.keterangan.length < 3) {
      return sendError(c, "Keterangan terlalu singkat!", 400);
    }

    const user = c.get("jwtPayload");
    const userId = user.sub ?? user.id;
    if (!userId) {
      return sendError(c, "Sesi tidak valid", 401);
    }

    body.status = "approved";
    // 🟢 FIX: Tangkap seksi_id jika dikirim, jika tidak jadikan null
    body.seksi_id = body.seksi_id ? Number(body.seksi_id) : null;

    await txService.createTransaction(c.env.DB, body, userId);
    return sendSuccess(c, "Transaksi Kas Baru berhasil dicatat.", null, 201);
  } catch (error) {
    console.error("ERROR POST /add-direct:", error);
    return sendError(c, "Terjadi kesalahan saat menyimpan transaksi", 500);
  }
});

// === 2. TRANSAKSI PROPOSAL ===
api.post("/add-proposal", async (c) => {
  try {
    const body = await c.req.json();

    if (
      !body.tipe ||
      !body.jumlah ||
      !body.keterangan ||
      !body.tanggal ||
      !body.kategori_id ||
      !body.seksi_id
    ) {
      return sendError(
        c,
        "Semua kolom termasuk Seksi Pengaju wajib diisi!",
        400,
      );
    }

    const nominal = Number(body.jumlah);
    if (isNaN(nominal) || nominal <= 0) {
      return sendError(
        c,
        "Jumlah nominal harus berupa angka lebih besar dari 0!",
        400,
      );
    }
    body.jumlah = nominal;

    if (!["pemasukan", "pengeluaran"].includes(body.tipe)) {
      return sendError(c, "Tipe transaksi tidak valid!", 400);
    }

    body.keterangan = String(body.keterangan).trim();
    if (body.keterangan.length < 3) {
      return sendError(c, "Keterangan terlalu singkat!", 400);
    }

    const user = c.get("jwtPayload");
    const userId = user.sub ?? user.id;
    if (!userId) {
      return sendError(c, "Sesi tidak valid", 401);
    }

    body.status = "pending";

    await txService.createTransaction(c.env.DB, body, userId);
    return sendSuccess(
      c,
      "Proposal berhasil diajukan dan masuk antrean.",
      null,
      201,
    );
  } catch (error) {
    console.error("ERROR POST /add-proposal:", error);
    return sendError(c, "Terjadi kesalahan saat mengajukan proposal", 500);
  }
});

api.get("/pending", async (c) => {
  try {
    const user = c.get("jwtPayload");
    const result = await txService.getPendingTransactions(c.env.DB, user);
    return sendSuccess(c, "Berhasil memuat transaksi tertunda", result.results);
  } catch (error) {
    console.error("ERROR GET /pending:", error);
    return sendError(c, "Gagal memuat transaksi tertunda", 500);
  }
});

api.get("/list", async (c) => {
  try {
    const user = c.get("jwtPayload");
    const result = await txService.getAllTransactions(c.env.DB, user);
    return sendSuccess(c, "Berhasil memuat daftar transaksi", result.results);
  } catch (error) {
    console.error("ERROR GET /list:", error);
    return sendError(c, "Gagal mengambil data transaksi", 500);
  }
});

// === OTORISASI KHUSUS ===
api.post("/approve/:id", requireRole(["superadmin", "ketua"]), async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return sendError(c, "ID transaksi tidak valid", 400);
    }
    const { action } = await c.req.json();

    if (action !== "approve" && action !== "reject") {
      return sendError(
        c,
        "Aksi tidak valid! Gunakan 'approve' atau 'reject'.",
        400,
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    await txService.updateStatus(c.env.DB, id, newStatus);
    return sendSuccess(c, `Transaksi berhasil di-${newStatus}`);
  } catch (error) {
    console.error(`ERROR POST /approve/${c.req.param("id")}:`, error);
    return sendError(c, "Gagal memproses persetujuan transaksi", 500);
  }
});

api.delete("/:id", requireRole(["superadmin", "ketua"]), async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return sendError(c, "ID transaksi tidak valid", 400);
    }
    await txService.deleteTransaction(c.env.DB, id);
    return sendSuccess(c, "Transaksi berhasil dihapus");
  } catch (error) {
    console.error(`ERROR DELETE /${c.req.param("id")}:`, error);
    return sendError(c, "Gagal menghapus transaksi", 500);
  }
});

export default api;
