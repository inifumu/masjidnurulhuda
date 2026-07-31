export const ADMIN_ROLES = ["superadmin", "ketua", "bendahara", "pengurus"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const TRANSACTION_TYPES = ["pemasukan", "pengeluaran"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ["pending_ketua", "pending_bendahara", "approved", "rejected", "void"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const APPROVAL_ACTIONS = ["approve", "reject"] as const;
export type ApprovalAction = (typeof APPROVAL_ACTIONS)[number];

export const CATEGORY_FLOWS = ["pemasukan", "pengeluaran", "general"] as const;
export type CategoryFlow = (typeof CATEGORY_FLOWS)[number];

export type FieldErrorMap = Record<string, string>;
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; fields: FieldErrorMap };
export type BusinessPeriod = { month: number; year: number };

const includes = <T extends string>(items: readonly T[], value: unknown): value is T =>
  typeof value === "string" && items.includes(value as T);

export const isAdminRole = (value: unknown): value is AdminRole => includes(ADMIN_ROLES, value);
export const isTransactionType = (value: unknown): value is TransactionType => includes(TRANSACTION_TYPES, value);
export const isTransactionStatus = (value: unknown): value is TransactionStatus => includes(TRANSACTION_STATUSES, value);

export const parseBusinessPeriod = (monthRaw: string | undefined, yearRaw: string | undefined): ValidationResult<BusinessPeriod> => {
  if (monthRaw === undefined || yearRaw === undefined) {
    const missing = monthRaw === undefined ? "month" : "year";
    return { ok: false, fields: { [missing]: "Bulan dan tahun harus dikirim bersamaan." } };
  }
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (!Number.isInteger(month) || month < 1 || month > 12) return { ok: false, fields: { month: "Bulan harus antara 1 dan 12." } };
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return { ok: false, fields: { year: "Tahun harus antara 2000 dan 2100." } };
  return { ok: true, value: { month, year } };
};

export const getCurrentWibPeriod = (now = new Date()): BusinessPeriod => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit",
  }).formatToParts(now);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  return Number.isInteger(month) && Number.isInteger(year)
    ? { month, year }
    : { month: now.getMonth() + 1, year: now.getFullYear() };
};

export const API_ERROR_CODES = [
  "VALIDATION_ERROR", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT",
  "RATE_LIMITED", "IDEMPOTENCY_REQUIRED", "IDEMPOTENCY_CONFLICT", "TRANSACTION_STATE_CHANGED", "INTERNAL_ERROR",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiSuccess<T = unknown> = { status: "success"; message: string; data?: T };
export type ApiErrorBody = { status: "error"; message: string; error: { code: ApiErrorCode; fields?: FieldErrorMap; request_id?: string } };

export const buildApiError = (code: ApiErrorCode, message: string, fields?: FieldErrorMap, requestId?: string): ApiErrorBody => ({
  status: "error",
  message,
  error: { code, ...(fields && Object.keys(fields).length ? { fields } : {}), ...(requestId ? { request_id: requestId } : {}) },
});

export const parseApiErrorBody = (value: unknown): ApiErrorBody => {
  if (value && typeof value === "object") {
    const body = value as Record<string, unknown>;
    const message = typeof body.message === "string" ? body.message : "Terjadi kesalahan pada server";
    const nested = body.error && typeof body.error === "object" ? body.error as Record<string, unknown> : null;
    const code = nested && typeof nested.code === "string" && API_ERROR_CODES.includes(nested.code as ApiErrorCode)
      ? nested.code as ApiErrorCode : "INTERNAL_ERROR";
    const fields = nested?.fields && typeof nested.fields === "object" ? nested.fields as FieldErrorMap : undefined;
    return buildApiError(code, message, fields);
  }
  return buildApiError("INTERNAL_ERROR", "Terjadi kesalahan pada server");
};

export type TransactionRequest = {
  tipe: TransactionType; jumlah: number; keperluan: string; keterangan: string; tanggal: string;
  kategori_id: number; seksi_id: number | null; metode: string;
};

const positiveInt = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isInteger(number) && number > 0 ? number : null;
};

const parseTransaction = (input: unknown, requireSection: boolean): ValidationResult<TransactionRequest> => {
  const raw = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const fields: FieldErrorMap = {};
  const tipe = isTransactionType(raw.tipe) ? raw.tipe : null;
  const jumlah = typeof raw.jumlah === "number" ? raw.jumlah : Number(raw.jumlah);
  const keperluan = typeof raw.keperluan === "string" ? raw.keperluan.trim() : "";
  const keterangan = typeof raw.keterangan === "string" ? raw.keterangan.trim() : "";
  const tanggal = typeof raw.tanggal === "string" ? raw.tanggal : "";
  const kategoriId = positiveInt(raw.kategori_id);
  const seksiId = raw.seksi_id === undefined || raw.seksi_id === null || raw.seksi_id === "" ? null : positiveInt(raw.seksi_id);
  const metode = typeof raw.metode === "string" ? raw.metode.trim() : "";
  if (!tipe) fields.tipe = "Tipe transaksi tidak valid.";
  if (!Number.isFinite(jumlah) || jumlah <= 0 || jumlah > 1_000_000_000_000) fields.jumlah = "Nominal harus lebih dari 0 dan dalam batas yang diizinkan.";
  if (keperluan.length < 5 || keperluan.length > 120) fields.keperluan = "Keperluan wajib diisi 5-120 karakter.";
  if (requireSection && (keterangan.length < 10 || keterangan.length > 2000)) fields.keterangan = "Keterangan proposal wajib diisi 10-2000 karakter.";
  if (!requireSection && keterangan.length > 1000) fields.keterangan = "Keterangan tambahan maksimum 1000 karakter.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) fields.tanggal = "Tanggal harus menggunakan format YYYY-MM-DD.";
  if (!kategoriId) fields.kategori_id = "Kategori wajib dipilih.";
  if (requireSection && !seksiId) fields.seksi_id = "Seksi wajib dipilih.";
  if (!metode) fields.metode = "Metode wajib dipilih.";
  if (Object.keys(fields).length) return { ok: false, fields };
  return { ok: true, value: { tipe: tipe!, jumlah, keperluan, keterangan, tanggal, kategori_id: kategoriId!, seksi_id: seksiId, metode } };
};

export const parseDirectTransaction = (input: unknown) => parseTransaction(input, false);
export const parseProposalTransaction = (input: unknown) => parseTransaction(input, true);

export const getErrorMessage = (error: unknown, fallback: string): string => error instanceof Error ? error.message : fallback;
