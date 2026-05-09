import { httpClient } from "../httpClient";

// ==========================================
// 🛡️ INTERFACES / DTO (Data Transfer Objects)
// ==========================================

export interface TransactionBasePayload {
  tipe: "pemasukan" | "pengeluaran";
  jumlah: number;
  keterangan: string;
  tanggal: string; // Format: YYYY-MM-DD
  kategori_id: number;
  metode: string;
}

// Seksi_id opsional untuk Kas Langsung
export interface DirectTransactionPayload extends TransactionBasePayload {
  seksi_id?: number | null;
}

// Seksi_id WAJIB untuk Proposal
export interface ProposalTransactionPayload extends TransactionBasePayload {
  seksi_id: number;
}

export interface KasCategory {
  id: number;
  nama_kategori: string;
  jenis_arus: "pemasukan" | "pengeluaran" | "general";
  name?: string;
}

export interface KasSection {
  id: number;
  nama_seksi: string;
  nama_pengurus?: string | null;
}

export interface KasTransaction {
  id: number;
  tipe: "pemasukan" | "pengeluaran";
  jumlah: number;
  keterangan: string;
  tanggal: string;
  kategori_id: number;
  kategori: string; // 🟢 Wajib ada (sudah dialias dari DB)
  seksi_id?: number | null;
  seksi: string | null; // 🟢 Wajib ada (walau isinya bisa null)
  status: "pending_ketua" | "pending_bendahara" | "approved" | "rejected";
  created_at?: string;
  approved_at?: string | null; // 🟢 Tambahan Audit Trail
}

export interface TransactionMasterData {
  categories?: KasCategory[];
  kategori?: KasCategory[];
  sections?: KasSection[];
  seksi?: KasSection[];
}

export interface KasMethod {
  id: string;
  name: string;
}

export interface GetTransactionsParams {
  month?: number;
  year?: number;
  tipe?: "pemasukan" | "pengeluaran";
  kategori_id?: number;
}

// ==========================================
// 🚀 SERVICE METHODS
// ==========================================

export const kasService = {
  async getMasterData(): Promise<TransactionMasterData> {
    const res = await httpClient<{ data: TransactionMasterData }>(
      "/api/admin/transaction/master-data",
    );
    return res.data;
  },

  getMethods(): KasMethod[] {
    return [
      { id: "kas_langsung", name: "Kas Langsung (Tunai/Bank)" },
      { id: "reimbursement", name: "Reimbursement (Ganti Uang)" },
    ];
  },

  async getTransactions(
    params?: GetTransactionsParams,
  ): Promise<KasTransaction[]> {
    try {
      const search = new URLSearchParams();

      if (params?.month !== undefined)
        search.set("month", String(params.month));
      if (params?.year !== undefined) search.set("year", String(params.year));
      if (params?.tipe) search.set("tipe", params.tipe);
      if (params?.kategori_id !== undefined) {
        search.set("kategori_id", String(params.kategori_id));
      }

      const queryString = search.toString();
      const endpoint = queryString
        ? `/api/admin/transaction/list?${queryString}`
        : "/api/admin/transaction/list";

      const res = await httpClient<{ data?: KasTransaction[] }>(endpoint);
      return res.data || [];
    } catch (error) {
      console.error("Gagal load transaksi:", error);
      return []; // Fallback agar tabel tidak error jika gagal load
    }
  },

  async submitDirectTransaction(payload: DirectTransactionPayload) {
    return await httpClient("/api/admin/transaction/add-direct", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async submitProposal(payload: ProposalTransactionPayload) {
    return await httpClient("/api/admin/transaction/add-proposal", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async approveTransaction(id: number, action: "approve" | "reject") {
    return await httpClient(`/api/admin/transaction/approve/${id}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  },

  async deleteTransaction(id: number) {
    return await httpClient(`/api/admin/transaction/${id}`, {
      method: "DELETE",
    });
  },
};
