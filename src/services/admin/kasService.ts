/**
 * Tujuan: Menjadi single source of truth untuk API Kas + orchestration call pattern transaksi.
 * Caller: useKasActions (state/UI orchestration), komponen kas via facade useKas.
 * Dependensi: httpClient, dashboardService, parser rupiah.
 * Main Functions: load master/transaksi/summary bundle, submit payload direct/proposal dari form.
 * Side Effects: Network request ke endpoint `/api/admin/transaction/*` dan `/api/admin/dashboard/summary`.
 */
import { parseInputRupiah } from "../../utils/currency";
import { dashboardService, type DashboardSummary } from "./dashboardService";
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

export type KasFilterTipe = "semua" | "pemasukan" | "pengeluaran";

export interface KasFilters {
  month: number;
  year: number;
  tipe: KasFilterTipe;
  kategori: number | "semua";
}

export interface KasTransactionFormState {
  tipe: "pemasukan" | "pengeluaran";
  jumlah: string;
  kategori_id: number | null;
  seksi_id: number | null;
  metode: string;
  tanggal: string;
  keterangan: string;
}

export interface KasDashboardBundle {
  transactions: KasTransaction[];
  summary: DashboardSummary;
}

const buildTransactionsQuery = (params?: GetTransactionsParams) => {
  const search = new URLSearchParams();

  if (params?.month !== undefined) search.set("month", String(params.month));
  if (params?.year !== undefined) search.set("year", String(params.year));
  if (params?.tipe) search.set("tipe", params.tipe);
  if (params?.kategori_id !== undefined) {
    search.set("kategori_id", String(params.kategori_id));
  }

  const queryString = search.toString();
  return queryString
    ? `/api/admin/transaction/list?${queryString}`
    : "/api/admin/transaction/list";
};

const buildRequestFilters = (filters: KasFilters): GetTransactionsParams => ({
  month: filters.month,
  year: filters.year,
  tipe: filters.tipe !== "semua" ? filters.tipe : undefined,
  kategori_id: filters.kategori !== "semua" ? filters.kategori : undefined,
});

const validateNominal = (value: string) => {
  const nominal = parseInputRupiah(value);
  if (!Number.isFinite(nominal) || nominal <= 0) {
    throw new Error("Nominal wajib lebih dari 0");
  }

  return nominal;
};

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
    const endpoint = buildTransactionsQuery(params);
    const res = await httpClient<{ data?: KasTransaction[] }>(endpoint);
    return res.data || [];
  },

  async getDashboardBundle(filters: KasFilters): Promise<KasDashboardBundle> {
    const requestFilters = buildRequestFilters(filters);
    const [transactions, summary] = await Promise.all([
      this.getTransactions(requestFilters),
      dashboardService.getSummary({
        month: filters.month,
        year: filters.year,
      }),
    ]);

    return {
      transactions,
      summary,
    };
  },

  async submitDirectTransaction(payload: DirectTransactionPayload) {
    return await httpClient("/api/admin/transaction/add-direct", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async submitDirectTransactionFromForm(form: KasTransactionFormState) {
    if (!form.kategori_id) {
      throw new Error("Kategori wajib dipilih");
    }

    const payload: DirectTransactionPayload = {
      ...form,
      jumlah: validateNominal(form.jumlah),
      kategori_id: form.kategori_id,
    };

    return await this.submitDirectTransaction(payload);
  },

  async submitProposal(payload: ProposalTransactionPayload) {
    return await httpClient("/api/admin/transaction/add-proposal", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async submitProposalFromForm(form: KasTransactionFormState) {
    if (!form.kategori_id) {
      throw new Error("Kategori wajib dipilih");
    }

    if (!form.seksi_id) {
      throw new Error("Seksi wajib dipilih");
    }

    const payload: ProposalTransactionPayload = {
      ...form,
      jumlah: validateNominal(form.jumlah),
      kategori_id: form.kategori_id,
      seksi_id: form.seksi_id,
    };

    return await this.submitProposal(payload);
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
