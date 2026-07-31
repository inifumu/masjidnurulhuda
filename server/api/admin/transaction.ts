import { Hono } from "hono";
import * as txService from "../../services/transaction.ts";
import * as seksiService from "../../services/seksi.ts";
import * as kategoriService from "../../services/kategori.ts";
import { requireAuth, requireRole } from "../../middleware/auth.ts";
import { sendSuccess, sendError } from "../../utils/response.ts";
import {
  VALID_TIPE,
  parsePositiveInt,
  parseFiniteAmount,
  parseVoidReason,
} from "../../utils/transactionValidation.ts";
import { canonicalRequestHash, getIdempotencyRecord, parseIdempotencyKey, resolveClaimFailure, resolveIdempotencyReplay, type IdempotencyContext } from "../../services/transactionIdempotency.ts";
import { getCurrentWibPeriod, parseBusinessPeriod, parseDirectTransaction, parseProposalTransaction, type AdminRole } from "../../../shared/contracts/index.ts";

type JwtPayload = {
  sub?: number;
  id?: number;
  role?: AdminRole;
};

type TransactionPeriodFilter = {
  month: number;
  year: number;
};

type TransactionListFilter = {
  tipe?: "pemasukan" | "pengeluaran";
  kategoriId?: number;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

const getConflictCode = (error: txService.TransactionConflictError) =>
  /idempoten|idempotency/i.test(error.message)
    ? "IDEMPOTENCY_CONFLICT" as const
    : "TRANSACTION_STATE_CHANGED" as const;

const prepareIdempotency = async (db: D1Database, actorId: number, operation: IdempotencyContext["operation"], keyRaw: unknown, payload: unknown) => {
  const key = parseIdempotencyKey(keyRaw);
  if (!key) return { error: "Idempotency-Key wajib berupa token 16-128 karakter" };
  const requestHash = await canonicalRequestHash(payload);
  const context = { key, operation, requestHash } satisfies IdempotencyContext;
  const stored = await getIdempotencyRecord(db, actorId, operation, key);
  return { context, replay: stored ? resolveIdempotencyReplay(stored, requestHash) : null };
};

const runClaimFirst = async <T>(db: D1Database, actorId: number, context: IdempotencyContext, mutation: () => Promise<T>) => {
  try { return { result: await mutation(), replay: null }; }
  catch (error) {
    if (error instanceof txService.TransactionConflictError && !/idempoten/i.test(error.message)) throw error;
    try { return { result: null, replay: await resolveClaimFailure(db, actorId, context) }; }
    catch (claimError) {
      if (claimError instanceof txService.TransactionConflictError) throw claimError;
      throw error;
    }
  }
};


const parseListFilter = (
  tipeRaw: string | undefined,
  kategoriRaw: string | undefined,
): { filters: TransactionListFilter; error?: string } => {
  const filters: TransactionListFilter = {};

  if (tipeRaw !== undefined) {
    if (tipeRaw !== "pemasukan" && tipeRaw !== "pengeluaran") {
      return {
        filters,
        error: "tipe tidak valid (pemasukan|pengeluaran)",
      };
    }
    filters.tipe = tipeRaw;
  }

  if (kategoriRaw !== undefined) {
    const kategoriId = parsePositiveInt(kategoriRaw);
    if (kategoriId === null) {
      return { filters, error: "kategori_id tidak valid (integer positif)" };
    }
    filters.kategoriId = kategoriId;
  }

  return { filters };
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

api.post("/add-direct", requireRole(["superadmin", "ketua", "bendahara"]), async (c) => {
  try {
    const body = await c.req.json();
    const parsedBody = parseDirectTransaction(body);
    if (!parsedBody.ok) return sendError(c, "Periksa kembali data transaksi.", 400, parsedBody.fields, "VALIDATION_ERROR");
    Object.assign(body, parsedBody.value);

    if (
      !body.tipe ||
      body.jumlah === undefined ||
      body.jumlah === null ||
      !body.keperluan ||
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

    const idem = await prepareIdempotency(c.env.DB, userId, "create_direct", c.req.header("Idempotency-Key"), body);
    if (idem.error) return sendError(c, idem.error, 400, undefined, "IDEMPOTENCY_REQUIRED");
    if (idem.replay) return sendSuccess(c, "Transaksi sebelumnya berhasil dicatat.", idem.replay.body, idem.replay.status);
    const outcome = await runClaimFirst(c.env.DB, userId, idem.context!, () => txService.createTransaction(c.env.DB, body, userId, idem.context!));
    if (outcome.replay) return sendSuccess(c, "Transaksi sebelumnya berhasil dicatat.", outcome.replay.body, outcome.replay.status);
    return sendSuccess(c, "Transaksi Kas Baru berhasil dicatat.", { transaction_id: outcome.result!.transactionId }, 201);
  } catch (error) {
    if (error instanceof txService.TransactionConflictError) return sendError(c, error.message, 409, undefined, getConflictCode(error));
    return sendError(c, "Terjadi kesalahan saat menyimpan transaksi", 500);
  }
});

api.post("/add-proposal", async (c) => {
  try {
    const body = await c.req.json();
    const parsedBody = parseProposalTransaction(body);
    if (!parsedBody.ok) return sendError(c, "Periksa kembali data proposal.", 400, parsedBody.fields, "VALIDATION_ERROR");
    Object.assign(body, parsedBody.value);
    if (
      !body.tipe ||
      body.jumlah === undefined ||
      body.jumlah === null ||
      !body.keperluan ||
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

    const idem = await prepareIdempotency(c.env.DB, userId, "submit_proposal", c.req.header("Idempotency-Key"), body);
    if (idem.error) return sendError(c, idem.error, 400, undefined, "IDEMPOTENCY_REQUIRED");
    if (idem.replay) return sendSuccess(c, "Proposal sebelumnya berhasil diajukan.", idem.replay.body, idem.replay.status);
    const outcome = await runClaimFirst(c.env.DB, userId, idem.context!, () => txService.createTransaction(c.env.DB, body, userId, idem.context!));
    if (outcome.replay) return sendSuccess(c, "Proposal sebelumnya berhasil diajukan.", outcome.replay.body, outcome.replay.status);
    return sendSuccess(c, "Proposal berhasil diajukan ke Ketua.", { transaction_id: outcome.result!.transactionId }, 201);
  } catch (error) {
    if (error instanceof txService.TransactionConflictError) return sendError(c, error.message, 409, undefined, getConflictCode(error));
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
    const monthRaw = c.req.query("month");
    const yearRaw = c.req.query("year");
    const tipeRaw = c.req.query("tipe");
    const kategoriRaw = c.req.query("kategori_id");

    const parsedPeriod = monthRaw === undefined && yearRaw === undefined
      ? { ok: true as const, value: getCurrentWibPeriod() }
      : parseBusinessPeriod(monthRaw, yearRaw);
    if (!parsedPeriod.ok) return sendError(c, "Periode tidak valid.", 400, parsedPeriod.fields, "VALIDATION_ERROR");

    const parsedFilters = parseListFilter(tipeRaw, kategoriRaw);
    if (parsedFilters.error) {
      return sendError(c, parsedFilters.error, 400);
    }

    const user = c.get("jwtPayload");
    const result = await txService.getAllTransactions(
      c.env.DB,
      user,
      parsedPeriod.value,
      parsedFilters.filters,
    );

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

      const { action, reason: reasonRaw } = await c.req.json();
      if (action !== "approve" && action !== "reject")
        return sendError(c, "Aksi tidak valid!", 400);

      const user = c.get("jwtPayload");
      const actorId = user.sub ?? user.id;
      if (!actorId) return sendError(c, "Sesi tidak valid", 401);

      const tx = await txService.getTransactionById(c.env.DB, id);
      if (!tx) return sendError(c, "Transaksi tidak ditemukan", 404);

      const operation = action === "reject" ? "reject"
        : tx.status === "pending_ketua" ? "approve_ketua" : "approve_bendahara";
      const payload = { transaction_id: id, action, reason: action === "reject" ? parseVoidReason(reasonRaw) : null };
      const idem = await prepareIdempotency(c.env.DB, actorId, operation, c.req.header("Idempotency-Key"), payload);
      if (idem.error) return sendError(c, idem.error, 400, undefined, "IDEMPOTENCY_REQUIRED");
      if (idem.replay) return sendSuccess(c, "Mutasi sebelumnya sudah berhasil.", idem.replay.body, idem.replay.status);

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
          return sendError(c, "Status proposal tidak valid untuk ditolak", 409);
        }

        const reason = parseVoidReason(reasonRaw);
        if (!reason) return sendError(c, "Alasan penolakan wajib 10-500 karakter", 400);
        const outcome = await runClaimFirst(c.env.DB, actorId, idem.context!, () => txService.updateStatus(c.env.DB, id, "rejected", actorId, reason, undefined, idem.context!));
        if (outcome.replay) return sendSuccess(c, "Proposal sebelumnya sudah ditolak.", outcome.replay.body, outcome.replay.status);
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
          const outcome = await runClaimFirst(c.env.DB, actorId, idem.context!, () => txService.updateStatus(c.env.DB, id, "pending_bendahara", actorId, null, undefined, idem.context!));
          if (outcome.replay) return sendSuccess(c, "Persetujuan sebelumnya sudah berhasil.", outcome.replay.body, outcome.replay.status);
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

          const outcome = await runClaimFirst(c.env.DB, actorId, idem.context!, () => txService.updateStatus(c.env.DB, id, "approved", actorId, null, hariIniWIB, idem.context!));
          if (outcome.replay) return sendSuccess(c, "Pencairan sebelumnya sudah berhasil.", outcome.replay.body, outcome.replay.status);
          return sendSuccess(c, "Cair! Transaksi masuk ke laporan hari ini.");
        }

        return sendError(c, "Proposal sudah diproses sebelumnya.", 409, undefined, "TRANSACTION_STATE_CHANGED");
      }

      return sendError(c, "Aksi tidak valid", 400);
    } catch (error: unknown) {
      if (error instanceof txService.TransactionConflictError) {
        return sendError(c, error.message, 409, undefined, getConflictCode(error));
      }
      return sendError(
        c,
        getErrorMessage(error) || "Gagal memproses persetujuan transaksi",
        400,
      );
    }
  },
);

api.delete(
  "/:id",
  requireRole(["superadmin", "ketua", "bendahara"]),
  (c) =>
    sendError(
      c,
      "Transaksi tidak dapat dihapus permanen. Gunakan pembatalan transaksi.",
      405,
    ),
);

api.get("/:id/timeline", async (c) => {
  const id = parsePositiveInt(c.req.param("id"));
  if (id === null) return sendError(c, "ID transaksi tidak valid", 400);
  try {
    const result = await txService.getTransactionAuditTimeline(c.env.DB, id, c.get("jwtPayload"));
    return sendSuccess(c, "Berhasil memuat riwayat transaksi", result);
  } catch (error) {
    if (error instanceof txService.TransactionConflictError) return sendError(c, error.message, 403, undefined, "FORBIDDEN");
    if (getErrorMessage(error).includes("tidak ditemukan")) return sendError(c, "Transaksi tidak ditemukan", 404);
    return sendError(c, "Gagal memuat riwayat transaksi", 500);
  }
});

api.post(
  "/:id/void",
  requireRole(["superadmin", "bendahara"]),
  async (c) => {
    const id = parsePositiveInt(c.req.param("id"));
    if (id === null) return sendError(c, "ID transaksi tidak valid", 400);

    const user = c.get("jwtPayload");
    const actorId = user.sub ?? user.id;
    if (!actorId) return sendError(c, "Sesi tidak valid", 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return sendError(c, "Payload tidak valid", 400);
    }

    const reason = parseVoidReason(
      typeof body === "object" && body !== null && "reason" in body
        ? (body as { reason?: unknown }).reason
        : null,
    );
    if (!reason) {
      return sendError(c, "Alasan pembatalan wajib 10-500 karakter", 400);
    }

    try {
      const idem = await prepareIdempotency(c.env.DB, actorId, "void", c.req.header("Idempotency-Key"), { transaction_id: id, reason });
      if (idem.error) return sendError(c, idem.error, 400, undefined, "IDEMPOTENCY_REQUIRED");
      if (idem.replay) return sendSuccess(c, "Pembatalan sebelumnya sudah berhasil", idem.replay.body, idem.replay.status);
      const outcome = await runClaimFirst(c.env.DB, actorId, idem.context!, () => txService.voidTransaction(
        c.env.DB, id, actorId, reason, idem.context!,
      ));
      if (outcome.replay) return sendSuccess(c, "Pembatalan sebelumnya sudah berhasil", outcome.replay.body, outcome.replay.status);
      const result = outcome.result;
      return sendSuccess(c, "Transaksi berhasil dibatalkan", result);
    } catch (error) {
      if (error instanceof txService.TransactionConflictError) {
        return sendError(c, error.message, 409, undefined, getConflictCode(error));
      }
      if (getErrorMessage(error).includes("tidak ditemukan")) {
        return sendError(c, "Transaksi tidak ditemukan", 404);
      }
      return sendError(c, "Gagal membatalkan transaksi", 500);
    }
  },
);

export default api;
