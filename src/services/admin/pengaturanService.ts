import { httpClient } from "../httpClient";

// ==========================================
// 🛡️ INTERFACES / DTO
// ==========================================
export interface KategoriPayload {
  nama_kategori: string;
  jenis_arus: JenisArus;
}

export interface SeksiPayload {
  nama_seksi: string;
  nama_pengurus: string;
}

export type JenisArus = "pemasukan" | "pengeluaran" | "general";
export type UserRole = "superadmin" | "ketua" | "pengurus";

export interface KategoriItem {
  id: number;
  nama_kategori: string;
  jenis_arus: JenisArus;
  name?: string;
}

export interface SeksiItem {
  id: number;
  nama_seksi: string;
  nama_pengurus: string | null;
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface CreateUserPayload {
  name: string;
  role: UserRole;
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  name: string;
  role: UserRole;
}

// ==========================================
// 🚀 SERVICE METHODS
// ==========================================
export const pengaturanService = {
  // --- KATEGORI ---
  async getKategori(): Promise<KategoriItem[]> {
    const res = await httpClient<{ data?: KategoriItem[] }>(
      "/api/admin/pengaturan/kategori",
    );
    return res.data || [];
  },
  async addKategori(payload: KategoriPayload) {
    return await httpClient("/api/admin/pengaturan/kategori", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateKategori(id: number, payload: KategoriPayload) {
    return await httpClient(`/api/admin/pengaturan/kategori/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  async deleteKategori(id: number) {
    return await httpClient(`/api/admin/pengaturan/kategori/${id}`, {
      method: "DELETE",
    });
  },

  // --- SEKSI ---
  async getSeksi(): Promise<SeksiItem[]> {
    const res = await httpClient<{ data?: SeksiItem[] }>(
      "/api/admin/pengaturan/seksi",
    );
    return res.data || [];
  },
  async addSeksi(payload: SeksiPayload) {
    return await httpClient("/api/admin/pengaturan/seksi", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateSeksi(id: number, payload: SeksiPayload) {
    return await httpClient(`/api/admin/pengaturan/seksi/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  async deleteSeksi(id: number) {
    return await httpClient(`/api/admin/pengaturan/seksi/${id}`, {
      method: "DELETE",
    });
  },

  // --- USERS (AKUN) ---
  async getUsers(): Promise<UserItem[]> {
    const res = await httpClient<{ data?: UserItem[] }>(
      "/api/admin/pengaturan/users",
    );
    return res.data || [];
  },
  async addUser(payload: CreateUserPayload) {
    return await httpClient("/api/admin/pengaturan/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateUser(id: number, payload: UpdateUserPayload) {
    return await httpClient(`/api/admin/pengaturan/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  async deleteUser(id: number) {
    return await httpClient(`/api/admin/pengaturan/users/${id}`, {
      method: "DELETE",
    });
  },
};
