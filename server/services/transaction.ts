/**
 * Tujuan: Service transaksi kas (create, list, approval, delete) dengan scoping RBAC.
 * Caller: Route admin transaksi (`server/api/admin/transaction.ts`).
 * Dependensi: Cloudflare D1 (`DB`) dan tabel `kas_masjid`, `kategori_kas`, `seksi_pengurus`.
 * Main Functions: `createTransaction`, `getPendingTransactions`, `getAllTransactions`, `updateStatus`, `deleteTransaction`.
 * Side Effects: Mutasi data transaksi + query list berbasis role/period/filter.
 */
import type { AdminRole, BusinessPeriod, TransactionStatus, TransactionType } from "../../shared/contracts/index.ts";
type SqlParam = string | number | null;

export class TransactionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionConflictError";
  }
}

export interface TransactionPayload {
  tipe: TransactionType;
  jumlah: number;
  keperluan: string;
  keterangan: string;
  tanggal: string;
  kategori_id: number;
  periode_id?: number | null;
  seksi_id?: number | null;
  metode?: string | null;
  status?: TransactionStatus;
}

export interface TransactionUserScope {
  sub?: number;
  id?: number;
  role?: AdminRole;
}

export type TransactionIdempotencyContext = {
  key: string;
  operation: "create_direct" | "submit_proposal" | "approve_ketua" | "approve_bendahara" | "reject" | "void";
  requestHash: string;
};

export const getTransactionById = async (db: D1Database, id: number) => {
  return await db
    .prepare("SELECT * FROM kas_masjid WHERE id = ?")
    .bind(id)
    .first();
};

export const createTransaction = async (
  db: D1Database,
  data: TransactionPayload,
  userId: number,
  idempotency?: TransactionIdempotencyContext,
) => {
  const {
    tipe,
    jumlah,
    keperluan,
    keterangan,
    tanggal,
    kategori_id,
    periode_id,
    seksi_id,
    metode,
    status,
  } = data;

  const finalStatus = status || "pending_ketua";

  const randomBytes = idempotency ? crypto.getRandomValues(new Uint32Array(1)) : null;
  const transactionId = randomBytes ? (randomBytes[0] & 0x7fffffff) || 1 : null;
  const insertStatement = db.prepare(
    transactionId
      ? `INSERT INTO kas_masjid
         (id, tipe, jumlah, keperluan, keterangan, tanggal, kategori_id, periode_id, seksi_id, metode_pembayaran, created_by, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO kas_masjid
         (tipe, jumlah, keperluan, keterangan, tanggal, kategori_id, periode_id, seksi_id, metode_pembayaran, created_by, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    ...(transactionId ? [transactionId] : []), tipe, jumlah, keperluan, keterangan, tanggal,
    kategori_id, periode_id ?? null, seksi_id ?? null, metode ?? null, userId, finalStatus,
  );
  const eventType = finalStatus === "approved" ? "created" : "submitted";
  const auditStatement = db.prepare(
    `INSERT INTO transaction_audit_events
     (transaction_id, event_type, from_status, to_status, actor_id)
     VALUES (${transactionId ? "?" : "last_insert_rowid()"}, ?, NULL, ?, ?)`,
  ).bind(...(transactionId ? [transactionId] : []), eventType, finalStatus, userId);

  if (!idempotency || !transactionId) {
    const results = await db.batch([insertStatement, auditStatement]);
    if ((results[0]?.meta?.changes ?? 0) !== 1 || (results[1]?.meta?.changes ?? 0) !== 1) {
      throw new TransactionConflictError("Transaksi dan audit event gagal disimpan secara atomic.");
    }
    return {
      ...results[0],
      transactionId: transactionId ?? Number(results[0]?.meta?.last_row_id),
    };
  }

  const responseBody = JSON.stringify({ transaction_id: transactionId });
  const claim = db.prepare(
    `INSERT INTO transaction_idempotency_keys
     (actor_id, operation, idempotency_key, request_hash, state)
     VALUES (?, ?, ?, ?, 'processing')`,
  ).bind(userId, idempotency.operation, idempotency.key, idempotency.requestHash);
  const finalize = db.prepare(
    `UPDATE transaction_idempotency_keys
     SET state = 'completed', transaction_id = ?, response_status = 201, response_body = ?
     WHERE actor_id = ? AND operation = ? AND idempotency_key = ? AND state = 'processing'`,
  ).bind(transactionId, responseBody, userId, idempotency.operation, idempotency.key);
  const results = await db.batch([claim, insertStatement, auditStatement, finalize]);
  if (results.some((result) => (result.meta?.changes ?? 0) !== 1)) {
    console.error("[transaction_idempotency_batch_mismatch]", {
      operation: idempotency.operation,
      changes: results.map((result) => result.meta?.changes ?? 0),
    });
    throw new TransactionConflictError("Mutasi idempotent gagal disimpan secara atomic.");
  }
  return { ...results[1], transactionId };
};

export const getPendingTransactions = async (
  db: D1Database,
  user: TransactionUserScope,
) => {
  // 🟢 UPDATE: Tambahkan ALIAS as kategori dan as seksi agar sama persis dengan query list
  let baseQuery = `
    SELECT t.*, k.nama_kategori as kategori, s.nama_seksi as seksi 
    FROM kas_masjid t
    JOIN kategori_kas k ON t.kategori_id = k.id
    LEFT JOIN seksi_pengurus s ON t.seksi_id = s.id
    WHERE t.status IN ('pending_ketua', 'pending_bendahara', 'rejected')
  `;

  if (user.role === "pengurus") {
    const userId = user.sub || user.id;
    baseQuery += ` AND t.created_by = ? ORDER BY t.created_at DESC`;
    return await db.prepare(baseQuery).bind(userId).all();
  }

  baseQuery += ` ORDER BY t.created_at DESC`;
  return await db.prepare(baseQuery).all();
};

export const updateStatus = async (
  db: D1Database, id: number, newStatus: TransactionStatus, actorId: number,
  reason?: string | null, accDate?: string, idempotency?: TransactionIdempotencyContext,
) => {
  const current = await db.prepare("SELECT status FROM kas_masjid WHERE id = ?").bind(id).first();
  if (!current) throw new Error("Transaksi tidak ditemukan.");
  const currentStatus = current.status as TransactionStatus;
  if (newStatus === "pending_bendahara" && currentStatus !== "pending_ketua") throw new TransactionConflictError("Proposal sudah tidak ada di antrean Ketua.");
  if (newStatus === "approved" && currentStatus !== "pending_bendahara") throw new TransactionConflictError("Proposal sudah tidak ada di antrean Bendahara.");
  if (newStatus === "rejected" && !["pending_ketua", "pending_bendahara"].includes(currentStatus)) throw new TransactionConflictError("Status proposal tidak valid untuk ditolak.");
  if (newStatus === "rejected" && !reason) throw new Error("Alasan penolakan wajib diisi.");
  let query = "UPDATE kas_masjid SET status = ?";
  const params: SqlParam[] = [newStatus];
  if (newStatus === "approved") {
    query += ", approved_at = CURRENT_TIMESTAMP";
    if (accDate) { query += ", tanggal = ?"; params.push(accDate); }
  }
  query += " WHERE id = ? AND status = ?";
  params.push(id, currentStatus);
  const eventType = newStatus === "pending_bendahara" ? "approved_ketua" : newStatus === "approved" ? "approved_bendahara" : "rejected";
  const update = db.prepare(query).bind(...params);
  const audit = db.prepare(`INSERT INTO transaction_audit_events
    (transaction_id, event_type, from_status, to_status, actor_id, reason)
    SELECT ?, ?, ?, ?, ?, ? WHERE changes() = 1`).bind(id, eventType, currentStatus, newStatus, actorId, reason ?? null);
  const claim = idempotency && db.prepare(`INSERT INTO transaction_idempotency_keys
    (actor_id, operation, idempotency_key, request_hash, transaction_id, state)
    VALUES (?, ?, ?, ?, ?, 'processing')`).bind(actorId, idempotency.operation, idempotency.key, idempotency.requestHash, id);
  const finalize = idempotency && db.prepare(`UPDATE transaction_idempotency_keys
    SET state = 'completed', response_status = 200, response_body = ?
    WHERE actor_id = ? AND operation = ? AND idempotency_key = ? AND state = 'processing'`)
    .bind(JSON.stringify({ transaction_id: id, status: newStatus }), actorId, idempotency.operation, idempotency.key);
  const results = await db.batch(claim && finalize ? [claim, update, audit, finalize] : [update, audit]);
  if (results.some((result) => (result.meta?.changes ?? 0) !== 1)) throw new TransactionConflictError("Konflik status transaksi; data mungkin telah diubah pengguna lain.");
  return results[claim ? 1 : 0];
};

export const assertFinancialFieldsMutable = (status: TransactionStatus) => {
  if (status === "approved" || status === "void") {
    throw new TransactionConflictError("Field finansial transaksi yang sudah approved tidak dapat diubah.");
  }
};

export const getTransactionAuditTimeline = async (db: D1Database, id: number, user?: TransactionUserScope) => {
  const transaction = await db.prepare("SELECT id, status, created_by FROM kas_masjid WHERE id = ?").bind(id)
    .first<{ id: number; status: TransactionStatus; created_by: number | null }>();
  if (!transaction) throw new Error("Transaksi tidak ditemukan.");
  const userId = user?.sub ?? user?.id;
  if (user?.role === "pengurus" && transaction.status !== "approved" && transaction.created_by !== userId) {
    throw new TransactionConflictError("Anda tidak memiliki akses ke riwayat transaksi ini.");
  }
  const result = await db.prepare(`SELECT e.id, e.event_type, e.from_status, e.to_status, e.reason, e.created_at, e.actor_id, u.name as actor_name
    FROM transaction_audit_events e LEFT JOIN users u ON u.id = e.actor_id
    WHERE e.transaction_id = ? ORDER BY e.created_at ASC, e.id ASC`).bind(id).all();
  const events = result.results ?? [];
  return { events, history_available: events.length > 0 };
};

type TransactionPeriodFilter = BusinessPeriod;

export type TransactionListFilter = {
  tipe?: TransactionType;
  kategoriId?: number;
};

export const getAllTransactions = async (
  db: D1Database,
  user: TransactionUserScope,
  period: TransactionPeriodFilter,
  filters: TransactionListFilter = {},
) => {
  let baseQuery = `
    SELECT 
      t.*, 
      k.nama_kategori as kategori, 
      s.nama_seksi as seksi
    FROM kas_masjid t
    JOIN kategori_kas k ON t.kategori_id = k.id
    LEFT JOIN seksi_pengurus s ON t.seksi_id = s.id
    WHERE t.periode_id IS NULL
      AND CAST(strftime('%m', t.tanggal) AS INTEGER) = ?
      AND CAST(strftime('%Y', t.tanggal) AS INTEGER) = ?
  `;

  const baseParams: SqlParam[] = [period.month, period.year];

  if (filters.tipe) {
    baseQuery += ` AND t.tipe = ?`;
    baseParams.push(filters.tipe);
  }

  if (filters.kategoriId !== undefined) {
    baseQuery += ` AND t.kategori_id = ?`;
    baseParams.push(filters.kategoriId);
  }

  if (user && user.role === "pengurus") {
    const userId = user.sub || user.id;
    if (!userId) {
      baseQuery += ` AND t.status = 'approved' ORDER BY t.tanggal DESC, t.created_at DESC`;
      return await db
        .prepare(baseQuery)
        .bind(...baseParams)
        .all();
    }

    baseQuery += ` AND (t.status = 'approved' OR t.created_by = ?) ORDER BY t.tanggal DESC, t.created_at DESC`;
    return await db
      .prepare(baseQuery)
      .bind(...baseParams, userId)
      .all();
  }

  baseQuery += ` ORDER BY t.tanggal DESC, t.created_at DESC`;
  return await db
    .prepare(baseQuery)
    .bind(...baseParams)
    .all();
};

export const voidTransaction = async (
  db: D1Database,
  id: number,
  actorId: number,
  reason: string,
  idempotency?: TransactionIdempotencyContext,
) => {
  const current = await db
    .prepare("SELECT status FROM kas_masjid WHERE id = ?")
    .bind(id)
    .first<{ status: TransactionStatus }>();

  if (!current) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  if (current.status !== "approved") {
    throw new TransactionConflictError(
      "Transaksi hanya dapat dibatalkan dari status approved.",
    );
  }

  const updateStatement = db
    .prepare(
      `UPDATE kas_masjid
       SET status = 'void', voided_at = CURRENT_TIMESTAMP, voided_by = ?, void_reason = ?
       WHERE id = ? AND status = 'approved'`,
    )
    .bind(actorId, reason, id);

  const auditStatement = db
    .prepare(
      `INSERT INTO transaction_audit_events
       (transaction_id, event_type, from_status, to_status, actor_id, reason)
       SELECT ?, ?, ?, ?, ?, ?
       WHERE changes() = 1`,
    )
    .bind(id, "voided", "approved", "void", actorId, reason);

  const claim = idempotency && db.prepare(`INSERT INTO transaction_idempotency_keys
    (actor_id, operation, idempotency_key, request_hash, transaction_id, state)
    VALUES (?, ?, ?, ?, ?, 'processing')`).bind(actorId, idempotency.operation, idempotency.key, idempotency.requestHash, id);
  const finalize = idempotency && db.prepare(`UPDATE transaction_idempotency_keys
    SET state = 'completed', response_status = 200, response_body = ?
    WHERE actor_id = ? AND operation = ? AND idempotency_key = ? AND state = 'processing'`)
    .bind(JSON.stringify({ transaction_id: id, status: "void" }), actorId, idempotency.operation, idempotency.key);
  const results = await db.batch(claim && finalize
    ? [claim, updateStatement, auditStatement, finalize]
    : [updateStatement, auditStatement]);

  if (results.some((result) => (result.meta?.changes ?? 0) !== 1)) {
    throw new TransactionConflictError(
      "Konflik status transaksi; data mungkin telah diubah pengguna lain.",
    );
  }

  return { id, status: "void" as const };
};
