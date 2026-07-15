/**
 * Tujuan: Wrapper HTTP client terpusat untuk request frontend ke API dengan normalisasi error non-2xx.
 * Caller: Seluruh service layer frontend (admin/public) yang melakukan network I/O.
 * Dependensi: Fetch API browser, konfigurasi `VITE_API_URL`.
 * Main Functions: `httpClient<T>()`, `ApiError`.
 * Side Effects: Mengirim request jaringan dengan `credentials: include` dan melempar error terstandar.
 */
import { parseApiErrorBody, type ApiErrorCode, type FieldErrorMap } from "../../shared/contracts/index.ts";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  isFormData?: boolean;
}

// Custom Error Class untuk menangkap status HTTP
export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  fields: FieldErrorMap;
  data: unknown;

  constructor(status: number, message: string, data?: unknown, code: ApiErrorCode = "INTERNAL_ERROR", fields: FieldErrorMap = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.data = data;
  }
}

export const httpClient = async <T = unknown>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> => {
  const { params, isFormData = false, ...customConfig } = options;

  // Set base URL (menyesuaikan environment Vite)
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const url = new URL(endpoint, baseUrl);

  if (params) {
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key]),
    );
  }

  // Konfigurasi default (wajib kirim cookie untuk auth)
  const headers: HeadersInit = {
    ...(customConfig.headers ?? {}),
  };

  if (!isFormData && !("Content-Type" in (headers as Record<string, string>))) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    ...customConfig,
    credentials: "include",
    headers,
  };

  try {
    const response = await fetch(url.toString(), config);

    // Parsing response JSON
    const data = await response.json().catch(() => null);

    // Jika HTTP status bukan 2xx (misal: 400 Bad Request, 401 Unauthorized)
    if (!response.ok) {
      const errorBody = parseApiErrorBody(data);
      throw new ApiError(
        response.status,
        errorBody.message || response.statusText,
        data,
        errorBody.error.code,
        errorBody.error.fields,
      );
    }

    return data as T;
  } catch (error) {
    // Lempar ulang ApiError agar bisa ditangkap oleh UI (Toast/Notifikasi)
    if (error instanceof ApiError) {
      throw error;
    }
    // Tangani error jaringan (koneksi terputus)
    throw new Error(
      error instanceof Error ? error.message : "Gagal terhubung ke server.",
    );
  }
};
