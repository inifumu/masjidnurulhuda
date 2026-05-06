/**
 * Tujuan: Helper validasi boundary DTO transaksi kas di route admin.
 * Caller: server/api/admin/transaction.ts
 * Dependensi: Tidak ada dependensi eksternal.
 * Main Functions: parsePositiveInt, parseFiniteAmount, VALID_TIPE.
 * Side Effects: Tidak ada.
 */

export const VALID_TIPE = new Set(["pemasukan", "pengeluaran"]);
const MAX_JUMLAH = 1_000_000_000_000; // 1 triliun, guard nilai tidak masuk akal

export function parsePositiveInt(value: unknown): number | null {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

export function parseFiniteAmount(value: unknown): number | null {
  const nominal =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isFinite(nominal) || nominal <= 0 || nominal > MAX_JUMLAH) {
    return null;
  }

  return nominal;
}
