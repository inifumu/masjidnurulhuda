<script setup lang="ts">
import { ref } from "vue";
import { Clock, Ban, CheckCircle, XCircle } from "lucide-vue-next";
import { useKas } from "../../../composables/admin/useKas";
import { useAuthStore } from "../../../stores/authStore";
import { toast } from "vue-sonner";
import ConfirmModal from "../../ui/ConfirmModal.vue"; // 🟢 Import Modal

const {
  pendingTransactions,
  rejectedTransactions,
  formatRupiah,
  handleAction,
} = useKas();

const authStore = useAuthStore();

// 🟢 STATE UNTUK MODAL
const isModalOpen = ref(false);
const modalData = ref({ id: 0, action: "" as "approve" | "reject" });

// Buka Modal Konfirmasi
const openConfirm = (id: number, action: "approve" | "reject") => {
  modalData.value = { id, action };
  isModalOpen.value = true;
};

// Eksekusi jika tombol "Ya" di klik
const executeAction = async () => {
  try {
    isModalOpen.value = false;

    // Asumsi: handleAction di useKas akan memanggil API dan mereload data
    // Perhatikan: string diubah ke 'approve' atau 'reject' sesuai validasi backend kita!
    await handleAction(modalData.value.id, modalData.value.action);

    if (modalData.value.action === "approve") {
      toast.success("Proposal berhasil disetujui!");
    } else {
      toast.success("Proposal berhasil ditolak!");
    }
  } catch (error: any) {
    toast.error(error.message || "Terjadi kesalahan saat memproses data.");
  }
};
</script>

<template>
  <div class="space-y-12">
    <ConfirmModal
      :isOpen="isModalOpen"
      @close="isModalOpen = false"
      @confirm="executeAction"
      :title="
        modalData.action === 'approve' ? 'Setujui Proposal?' : 'Tolak Proposal?'
      "
      :message="
        modalData.action === 'approve'
          ? 'Dana akan dicatat ke dalam buku kas keuangan.'
          : 'Proposal ini akan dibatalkan dan masuk ke riwayat penolakan.'
      "
      :type="modalData.action === 'approve' ? 'success' : 'danger'"
      :confirmText="
        modalData.action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'
      "
    />

    <div class="space-y-4">
      <div class="flex items-center gap-2 text-amber-600 px-1">
        <Clock :size="18" />
        <h3 class="font-bold text-xs uppercase tracking-widest">
          {{
            authStore.user?.role === "pengurus"
              ? "Status Pengajuan Proposal Anda"
              : "Antrean Verifikasi Proposal"
          }}
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800"
            >
              <th class="py-3 px-4">Tgl & Jenis</th>
              <th class="py-3 px-4">Data Transaksi</th>
              <th class="py-3 px-4">Seksi</th>
              <th class="py-3 px-4 text-right">Nominal</th>
              <th
                v-if="authStore.user?.role !== 'pengurus'"
                class="py-3 px-4 text-center"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="trx in pendingTransactions"
              :key="trx.id"
              class="text-sm group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default"
            >
              <td class="py-4 px-4 text-sm">
                <div class="font-medium text-slate-700 dark:text-slate-300">
                  {{ trx.tanggal }}
                </div>
                <div
                  class="text-[10px] font-bold mt-1"
                  :class="
                    trx.tipe === 'pemasukan'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  "
                >
                  {{ trx.tipe === "pemasukan" ? "MASUK" : "KELUAR" }}
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="text-sm font-semibold">{{ trx.keterangan }}</div>
                <div
                  class="text-[10px] text-slate-400 uppercase tracking-tight mt-0.5"
                >
                  {{ trx.kategori }}
                </div>
              </td>
              <td class="py-4 px-4 text-sm text-slate-500">
                {{ trx.seksi || "-" }}
              </td>
              <td class="py-4 px-4 text-sm font-bold text-right">
                {{ formatRupiah(trx.jumlah) }}
              </td>

              <td v-if="authStore.user?.role !== 'pengurus'" class="py-4 px-4">
                <div class="flex justify-center gap-2">
                  <button
                    @click="openConfirm(trx.id, 'approve')"
                    class="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm"
                  >
                    <CheckCircle :size="16" />
                  </button>
                  <button
                    @click="openConfirm(trx.id, 'reject')"
                    class="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm"
                  >
                    <XCircle :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="pendingTransactions.length === 0">
              <td
                :colspan="authStore.user?.role !== 'pengurus' ? 5 : 4"
                class="py-16 text-center text-slate-400 text-sm"
              >
                Tidak ada antrean persetujuan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="rejectedTransactions.length > 0" class="space-y-4">
      <div class="flex items-center gap-2 text-slate-500 px-1">
        <Ban :size="18" />
        <h3 class="font-bold text-xs uppercase tracking-widest">
          Riwayat Penolakan
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left opacity-70">
          <thead>
            <tr
              class="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800"
            >
              <th class="py-3 px-4">Tgl & Jenis</th>
              <th class="py-3 px-4">Keterangan</th>
              <th class="py-3 px-4">Seksi</th>
              <th class="py-3 px-4 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="trx in rejectedTransactions" :key="trx.id">
              <td class="py-3 px-4 text-xs font-medium text-slate-500">
                {{ trx.tanggal }}
                <span
                  class="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-slate-200 dark:bg-slate-700"
                  >{{ trx.tipe }}</span
                >
              </td>
              <td
                class="py-3 px-4 text-sm text-slate-500 line-through decoration-slate-300"
              >
                {{ trx.keterangan }}
              </td>
              <td class="py-3 px-4 text-xs text-slate-500">
                {{ trx.seksi || "-" }}
              </td>
              <td class="py-3 px-4 text-sm font-bold text-right text-slate-500">
                {{ formatRupiah(trx.jumlah) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
