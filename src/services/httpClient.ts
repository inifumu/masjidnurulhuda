// src/services/httpClient.ts

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  isFormData?: boolean;
}

// Custom Error Class untuk menangkap status HTTP
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const httpClient = async <T = any>(
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
      const errorMessage =
        data?.message || response.statusText || "Terjadi kesalahan pada server";
      throw new ApiError(response.status, errorMessage, data);
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
