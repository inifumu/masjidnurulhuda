<script setup lang="ts">
import { ref, computed } from "vue";
import { Clock, Ban, CheckCircle, XCircle, Wallet } from "lucide-vue-next";
import { useKas } from "../../../composables/admin/useKas";
import { useAuthStore } from "../../../stores/authStore";
import { toast } from "vue-sonner";
import ConfirmModal from "../../ui/ConfirmModal.vue";

const {
  pendingTransactions,
  rejectedTransactions, // Pastikan ini ter-import dari useKas
  formatRupiah,
  handleAction,
} = useKas();

const authStore = useAuthStore();

// 🟢 COMPUTED (POIN 3): Hapus (t: any), biarkan Vue meng-infer tipe KasTransaction secara otomatis
const listKetua = computed(() =>
  pendingTransactions.value.filter((t) => t.status === "pending_ketua"),
);

const listBendahara = computed(() =>
  pendingTransactions.value.filter((t) => t.status === "pending_bendahara"),
);

// 🟢 CLEAN UP (POIN 6): Cukup gunakan satu sumber dari useKas, tanpa perlu filter ulang/deduplikasi
const listRejected = computed(() => rejectedTransactions.value);

// Role Helpers
const isBendahara = computed(() => authStore.user?.role === "bendahara");
const isKetua = computed(() => authStore.user?.role === "ketua");
const isSuperadmin = computed(() => authStore.user?.role === "superadmin");

// STATE UNTUK MODAL
const isModalOpen = ref(false);
const modalData = ref({
  id: 0,
  action: "" as "approve" | "reject",
  currentStatus: "",
});

const openConfirm = (
  id: number,
  action: "approve" | "reject",
  currentStatus: string,
) => {
  modalData.value = { id, action, currentStatus };
  isModalOpen.value = true;
};

const executeAction = async () => {
  try {
    isModalOpen.value = false;
    await handleAction(modalData.value.id, modalData.value.action);

    if (modalData.value.action === "approve") {
      if (modalData.value.currentStatus === "pending_bendahara") {
        toast.success("Dana berhasil dicairkan & masuk buku kas!");
      } else {
        toast.success("Proposal disetujui, diteruskan ke Bendahara!");
      }
    } else {
      toast.success("Proposal berhasil ditolak!");
    }
  } catch (error: any) {
    toast.error(error.message || "Terjadi kesalahan saat memproses data.");
  }
};
</script>

<template>
  <div class="space-y-12 flex flex-col">
    <!-- MODAL PINTAR -->
    <ConfirmModal
      :isOpen="isModalOpen"
      @close="isModalOpen = false"
      @confirm="executeAction"
      :title="
        modalData.action === 'approve'
          ? modalData.currentStatus === 'pending_bendahara'
            ? 'Cairkan Dana?'
            : 'Setujui Proposal?'
          : 'Tolak Proposal?'
      "
      :message="
        modalData.action === 'approve'
          ? modalData.currentStatus === 'pending_bendahara'
            ? 'Dana akan dipotong dari kas dan dicatat per hari ini (Hack Tanggal).'
            : 'Proposal akan diteruskan ke antrean Bendahara.'
          : 'Proposal ini akan dibatalkan dan masuk ke riwayat penolakan.'
      "
      :type="modalData.action === 'approve' ? 'success' : 'danger'"
      :confirmText="
        modalData.action === 'approve'
          ? modalData.currentStatus === 'pending_bendahara'
            ? 'Ya, Cairkan'
            : 'Ya, Setujui'
          : 'Ya, Tolak'
      "
    />

    <!-- ============================================== -->
    <!-- TAHAP 1: KETUA (Tampil di urutan 1 kalau bukan bendahara) -->
    <!-- ============================================== -->
    <div
      class="space-y-4"
      :class="isBendahara ? 'order-2 opacity-75' : 'order-1'"
    >
      <div class="flex items-center gap-2 text-amber-600 px-1">
        <Clock :size="18" />
        <h3 class="font-bold text-xs uppercase tracking-widest">
          Tahap 1: Verifikasi Ketua
        </h3>
      </div>
      <div
        class="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50"
      >
        <table class="w-full text-left">
          <thead>
            <tr
              class="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800"
            >
              <th class="py-3 px-4">Tgl & Jenis</th>
              <th class="py-3 px-4">Data Transaksi</th>
              <th class="py-3 px-4">Seksi</th>
              <th class="py-3 px-4 text-right">Nominal</th>
              <th v-if="isKetua || isSuperadmin" class="py-3 px-4 text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="trx in listKetua"
              :key="trx.id"
              class="text-sm group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-4 px-4">
                <div class="font-medium">{{ trx.tanggal }}</div>
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
              <td class="py-4 px-4 text-slate-500">{{ trx.seksi || "-" }}</td>
              <td class="py-4 px-4 font-bold text-right">
                {{ formatRupiah(trx.jumlah) }}
              </td>
              <td v-if="isKetua || isSuperadmin" class="py-4 px-4">
                <div class="flex justify-center gap-2">
                  <button
                    @click="openConfirm(trx.id, 'approve', trx.status)"
                    title="Setujui"
                    class="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                  >
                    <CheckCircle :size="16" />
                  </button>
                  <button
                    @click="openConfirm(trx.id, 'reject', trx.status)"
                    title="Tolak"
                    class="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                  >
                    <XCircle :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="listKetua.length === 0">
              <td
                :colspan="isKetua || isSuperadmin ? 5 : 4"
                class="py-8 text-center text-slate-400 text-sm"
              >
                Antrean Verifikasi Ketua Kosong.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAHAP 2: BENDAHARA (Tampil di urutan 1 kalau role-nya bendahara) -->
    <!-- ============================================== -->
    <div
      class="space-y-4"
      :class="isBendahara ? 'order-1' : 'order-2 opacity-75'"
    >
      <div class="flex items-center gap-2 text-indigo-500 px-1">
        <Wallet :size="18" />
        <h3 class="font-bold text-xs uppercase tracking-widest">
          Tahap 2: Antrean Pencairan
        </h3>
      </div>
      <div
        class="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50"
      >
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
                v-if="isBendahara || isSuperadmin"
                class="py-3 px-4 text-center"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="trx in listBendahara"
              :key="trx.id"
              class="text-sm group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-4 px-4">
                <div class="font-medium">{{ trx.tanggal }}</div>
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
              <td class="py-4 px-4 text-slate-500">{{ trx.seksi || "-" }}</td>
              <td class="py-4 px-4 font-bold text-right">
                {{ formatRupiah(trx.jumlah) }}
              </td>
              <td v-if="isBendahara || isSuperadmin" class="py-4 px-4">
                <div class="flex justify-center gap-2">
                  <button
                    @click="openConfirm(trx.id, 'approve', trx.status)"
                    title="Cairkan Dana"
                    class="p-2 flex items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                  >
                    <Wallet :size="16" />
                    <span
                      class="text-[10px] font-bold uppercase tracking-wider pr-1"
                      >Cairkan</span
                    >
                  </button>
                  <button
                    @click="openConfirm(trx.id, 'reject', trx.status)"
                    title="Tolak"
                    class="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                  >
                    <XCircle :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="listBendahara.length === 0">
              <td
                :colspan="isBendahara || isSuperadmin ? 5 : 4"
                class="py-8 text-center text-slate-400 text-sm"
              >
                Antrean Pencairan Kosong.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAHAP 3: REJECTED (Selalu di bawah) -->
    <!-- ============================================== -->
    <div v-if="listRejected.length > 0" class="space-y-4 order-3 mt-8">
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
            <tr v-for="trx in listRejected" :key="trx.id">
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
