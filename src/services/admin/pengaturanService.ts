/**
 * Tujuan: Menjadi single source of truth untuk API Pengaturan + orchestration CRUD per tab.
 * Caller: usePengaturanActions (frontend orchestration state/UI), watcher pengaturan.
 * Dependensi: httpClient.
 * Main Functions: CRUD kategori/seksi/akun + helper load/save/delete by tab.
 * Side Effects: Network request ke endpoint `/api/admin/pengaturan/*`.
 */
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
export type UserRole = "superadmin" | "ketua" | "bendahara" | "pengurus";

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

export type PengaturanTab = "kategori" | "seksi" | "akun";

export interface PengaturanFormState {
  nama: string;
  jenis_arus: JenisArus;
  nama_pengurus_list: string[];
  role: UserRole;
  email: string;
  password: string;
}

export interface PengaturanSaveContext {
  tab: PengaturanTab;
  editId: number | null;
  form: PengaturanFormState;
}

export interface PengaturanSaveResult {
  shouldWarnRelogin: boolean;
}

const extractFilledNames = (items: string[]) =>
  items.map((item) => item.trim()).filter((item) => item !== "");

const buildKategoriPayload = (form: PengaturanFormState): KategoriPayload => {
  const nama_kategori = form.nama.trim();
  if (!nama_kategori) {
    throw new Error("Nama kategori wajib diisi");
  }

  return {
    nama_kategori,
    jenis_arus: form.jenis_arus,
  };
};

const buildSeksiPayload = (form: PengaturanFormState): SeksiPayload => {
  const nama_seksi = form.nama.trim();
  if (!nama_seksi) {
    throw new Error("Nama seksi wajib diisi");
  }

  return {
    nama_seksi,
    nama_pengurus: extractFilledNames(form.nama_pengurus_list).join(", "),
  };
};

const buildCreateUserPayload = (
  form: PengaturanFormState,
): CreateUserPayload => {
  const name = form.nama.trim();
  const email = form.email.trim();
  const password = form.password;

  if (!name || !email || !password) {
    throw new Error("Nama, Email, dan Password wajib diisi");
  }

  return {
    name,
    email,
    password,
    role: form.role,
  };
};

const buildUpdateUserPayload = (
  form: PengaturanFormState,
): UpdateUserPayload => {
  const name = form.nama.trim();
  if (!name) {
    throw new Error("Nama pengguna wajib diisi");
  }

  return {
    name,
    role: form.role,
  };
};

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

  async loadByTab(tab: PengaturanTab) {
    if (tab === "kategori") {
      return {
        kategori: await this.getKategori(),
      };
    }

    if (tab === "seksi") {
      return {
        seksi: await this.getSeksi(),
      };
    }

    return {
      akun: await this.getUsers(),
    };
  },

  async saveByTab(
    context: PengaturanSaveContext,
  ): Promise<PengaturanSaveResult> {
    const { tab, editId, form } = context;

    if (tab === "kategori") {
      const payload = buildKategoriPayload(form);
      if (editId === null) {
        await this.addKategori(payload);
      } else {
        await this.updateKategori(editId, payload);
      }

      return { shouldWarnRelogin: false };
    }

    if (tab === "seksi") {
      const payload = buildSeksiPayload(form);
      if (editId === null) {
        await this.addSeksi(payload);
      } else {
        await this.updateSeksi(editId, payload);
      }

      return { shouldWarnRelogin: false };
    }

    if (editId === null) {
      await this.addUser(buildCreateUserPayload(form));
      return { shouldWarnRelogin: false };
    }

    await this.updateUser(editId, buildUpdateUserPayload(form));
    return { shouldWarnRelogin: true };
  },

  async deleteByTab(tab: PengaturanTab, id: number) {
    if (tab === "kategori") {
      await this.deleteKategori(id);
      return;
    }

    if (tab === "seksi") {
      await this.deleteSeksi(id);
      return;
    }

    await this.deleteUser(id);
  },
};
