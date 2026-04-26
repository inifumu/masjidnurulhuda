// Pastikan path import ini sesuai dengan lokasi file httpClient Anda
import { httpClient } from "../httpClient";

export const kasService = {
  async getMasterData() {
    const res = await httpClient("/api/admin/transaction/master-data");
    return res.data;
  },

  getMethods() {
    return [
      { id: "kas_langsung", name: "Kas Langsung (Tunai/Bank)" },
      { id: "reimbursement", name: "Reimbursement (Ganti Uang)" },
    ];
  },

  async getTransactions() {
    try {
      const res = await httpClient("/api/admin/transaction/list");
      return res.data;
    } catch (error) {
      console.error("Gagal load transaksi:", error);
      return []; // Fallback agar tabel tidak error jika gagal load
    }
  },

  // 🟢 FUNGSI BARU 1: Untuk Kas Langsung (Tanpa Seksi)
  async submitDirectTransaction(payload: any) {
    return await httpClient("/api/admin/transaction/add-direct", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // 🟢 FUNGSI BARU 2: Untuk Proposal (Wajib Seksi)
  async submitProposal(payload: any) {
    return await httpClient("/api/admin/transaction/add-proposal", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Tipe action disesuaikan dengan validasi backend ("approve" | "reject")
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
