<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
// 🟢 UPDATE: Import CheckCircle dan Zap dari lucide
import { Trash2, Filter, ChevronDown, CheckCircle, Zap } from "lucide-vue-next";
import { useKas } from "../../../composables/admin/useKas";
import { useAuthStore } from "../../../stores/authStore";
import { toast } from "vue-sonner";
import ConfirmModal from "../../ui/ConfirmModal.vue";
import { canDelete } from "../../../utils/permissions";

const {
  filteredLaporan,
  filteredMasuk,
  filteredKeluar,
  formatRupiah,
  formatWaktuAudit,
  handleDelete,
  selectedMonth,
  selectedYear,
  availableYears,
  filterTipe,
  filterKategori,
  categories,
} = useKas();

const authStore = useAuthStore();

const canDeleteTransaction = () => canDelete(authStore.user?.role);

// --- STATE FILTER ---
const months = [
  { value: 1, name: "Januari" },
  { value: 2, name: "Februari" },
  { value: 3, name: "Maret" },
  { value: 4, name: "April" },
  { value: 5, name: "Mei" },
  { value: 6, name: "Juni" },
  { value: 7, name: "Juli" },
  { value: 8, name: "Agustus" },
  { value: 9, name: "September" },
  { value: 10, name: "Oktober" },
  { value: 11, name: "November" },
  { value: 12, name: "Desember" },
];

const openFilter = ref<string | null>(null);
const toggleFilter = (name: string) =>
  (openFilter.value = openFilter.value === name ? null : name);
const closeFilters = () => (openFilter.value = null);

onMounted(() => document.addEventListener("click", closeFilters));
onUnmounted(() => document.removeEventListener("click", closeFilters));

// STATE & LOGIC UNTUK MODAL HAPUS
const isDeleteModalOpen = ref(false);
const selectedDeleteId = ref<number | null>(null);

const openDeleteConfirm = (id: number) => {
  selectedDeleteId.value = id;
  isDeleteModalOpen.value = true;
};

const executeDelete = async () => {
  if (!selectedDeleteId.value) return;

  try {
    isDeleteModalOpen.value = false;
    await handleDelete(selectedDeleteId.value);
    toast.success("Transaksi berhasil dihapus permanen!");
  } catch (error: any) {
    toast.error(error.message || "Gagal menghapus transaksi.");
  }
};
</script>

<template>
  <div class="space-y-6">
    <ConfirmModal
      :isOpen="isDeleteModalOpen"
      @close="isDeleteModalOpen = false"
      @confirm="executeDelete"
      title="Hapus Transaksi?"
      message="Data transaksi ini akan dihapus secara permanen dari buku kas dan tidak dapat dikembalikan. Lanjutkan?"
      type="danger"
      confirmText="Ya, Hapus Permanen"
    />

    <div
      class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4"
    >
      <div
        class="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold text-sm"
      >
        <Filter :size="16" /> Saring Data Laporan
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="relative" @click.stop>
          <div
            @click="toggleFilter('bulan')"
            class="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg text-sm cursor-pointer hover:border-brand-green transition-colors"
          >
            <span class="truncate">{{
              months.find((m) => m.value === selectedMonth)?.name
            }}</span>
            <ChevronDown
              :size="14"
              class="text-slate-400"
              :class="
                openFilter === 'bulan' ? 'rotate-180 text-brand-green' : ''
              "
            />
          </div>
          <Transition name="fade-slide">
            <div
              v-if="openFilter === 'bulan'"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto"
            >
              <div
                v-for="m in months"
                :key="m.value"
                @click="
                  selectedMonth = m.value;
                  openFilter = null;
                "
                class="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm transition-colors"
                :class="
                  selectedMonth === m.value
                    ? 'text-brand-green font-bold bg-brand-green/5'
                    : ''
                "
              >
                {{ m.name }}
              </div>
            </div>
          </Transition>
        </div>

        <div class="relative" @click.stop>
          <div
            @click="toggleFilter('tahun')"
            class="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg text-sm cursor-pointer hover:border-brand-green transition-colors"
          >
            <span>{{ selectedYear }}</span>
            <ChevronDown
              :size="14"
              class="text-slate-400"
              :class="
                openFilter === 'tahun' ? 'rotate-180 text-brand-green' : ''
              "
            />
          </div>
          <Transition name="fade-slide">
            <div
              v-if="openFilter === 'tahun'"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1"
            >
              <div
                v-for="y in availableYears"
                :key="y"
                @click="
                  selectedYear = y;
                  openFilter = null;
                "
                class="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm transition-colors"
                :class="
                  selectedYear === y
                    ? 'text-brand-green font-bold bg-brand-green/5'
                    : ''
                "
              >
                {{ y }}
              </div>
            </div>
          </Transition>
        </div>

        <div class="relative" @click.stop>
          <div
            @click="toggleFilter('tipe')"
            class="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg text-sm cursor-pointer hover:border-brand-green transition-colors"
          >
            <span class="truncate">{{
              filterTipe === "semua"
                ? "Semua Transaksi"
                : filterTipe === "pemasukan"
                  ? "Hanya Pemasukan"
                  : "Hanya Pengeluaran"
            }}</span>
            <ChevronDown
              :size="14"
              class="text-slate-400"
              :class="
                openFilter === 'tipe' ? 'rotate-180 text-brand-green' : ''
              "
            />
          </div>
          <Transition name="fade-slide">
            <div
              v-if="openFilter === 'tipe'"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1"
            >
              <div
                @click="
                  filterTipe = 'semua';
                  openFilter = null;
                "
                class="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm transition-colors"
                :class="
                  filterTipe === 'semua'
                    ? 'text-brand-green font-bold bg-brand-green/5'
                    : ''
                "
              >
                Semua Transaksi
              </div>
              <div
                @click="
                  filterTipe = 'pemasukan';
                  openFilter = null;
                "
                class="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm transition-colors"
                :class="
                  filterTipe === 'pemasukan'
                    ? 'text-brand-green font-bold bg-brand-green/5'
                    : ''
                "
              >
                Hanya Pemasukan
              </div>
              <div
                @click="
                  filterTipe = 'pengeluaran';
                  openFilter = null;
                "
                class="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm transition-colors"
                :class="
                  filterTipe === 'pengeluaran'
                    ? 'text-brand-green font-bold bg-brand-green/5'
                    : ''
                "
              >
                Hanya Pengeluaran
              </div>
            </div>
          </Transition>
        </div>

        <div class="relative" @click.stop>
          <div
            @click="toggleFilter('kategori')"
            class="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg text-sm cursor-pointer hover:border-brand-green transition-colors"
          >
            <span class="truncate">{{
              filterKategori === "semua"
                ? "Semua Kategori"
                : categories.find((c) => c.id === filterKategori)
                    ?.nama_kategori ||
                  categories.find((c) => c.id === filterKategori)?.name
            }}</span>
            <ChevronDown
              :size="14"
              class="text-slate-400"
              :class="
                openFilter === 'kategori' ? 'rotate-180 text-brand-green' : ''
              "
            />
          </div>
          <Transition name="fade-slide">
            <div
              v-if="openFilter === 'kategori'"
              class="absolute z-50 w-full mt-1 bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto"
            >
              <div
                @click="
                  filterKategori = 'semua';
                  openFilter = null;
                "
                class="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm transition-colors"
                :class="
                  filterKategori === 'semua'
                    ? 'text-brand-green font-bold bg-brand-green/5'
                    : ''
                "
              >
                Semua Kategori
              </div>
              <div
                v-for="c in categories"
                :key="c.id"
                @click="
                  filterKategori = c.id;
                  openFilter = null;
                "
                class="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm transition-colors"
                :class="
                  filterKategori === c.id
                    ? 'text-brand-green font-bold bg-brand-green/5'
                    : ''
                "
              >
                {{ c.nama_kategori || c.name }}
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div
        class="flex gap-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm"
      >
        <div class="text-slate-500">
          Total Masuk (Filter):
          <strong class="text-emerald-600">{{
            formatRupiah(filteredMasuk)
          }}</strong>
        </div>
        <div class="text-slate-500">
          Total Keluar (Filter):
          <strong class="text-rose-600">{{
            formatRupiah(filteredKeluar)
          }}</strong>
        </div>
      </div>
    </div>

    <div
      class="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800"
    >
      <table class="w-full text-left border-collapse">
        <thead
          class="bg-slate-50 dark:bg-slate-900/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700"
        >
          <tr>
            <th class="py-3 px-4">Tanggal</th>
            <th class="py-3 px-4">Uraian / Kategori</th>
            <th
              class="py-3 px-4 text-right bg-emerald-50/50 dark:bg-emerald-900/10"
            >
              Debit (Masuk)
            </th>
            <th class="py-3 px-4 text-right bg-rose-50/50 dark:bg-rose-900/10">
              Kredit (Keluar)
            </th>
            <th v-if="canDeleteTransaction()" class="py-3 px-4 text-center">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody
          class="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-[#121826]"
        >
          <tr
            v-for="trx in filteredLaporan"
            :key="trx.id"
            class="text-sm group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default"
          >
            <!-- 🟢 Kolom Tanggal STERIL EMOJI -->
            <td class="py-3 px-4 whitespace-nowrap">
              <div class="text-slate-500 font-medium">{{ trx.tanggal }}</div>

              <!-- Jika cair dari Proposal -->
              <div
                v-if="trx.approved_at"
                class="flex items-center gap-1 text-[10px] font-medium mt-1"
                :class="
                  trx.tipe === 'pengeluaran'
                    ? 'text-rose-600/80'
                    : 'text-emerald-600/80'
                "
                :title="
                  trx.tipe === 'pengeluaran'
                    ? 'Waktu Pencairan Aktual (Pengeluaran)'
                    : 'Waktu Pemasukan Aktual (Pemasukan)'
                "
              >
                <CheckCircle :size="12" />
                <span>
                  {{ trx.tipe === "pengeluaran" ? "Cair" : "Masuk" }}:
                  {{ formatWaktuAudit(trx.approved_at) }}
                </span>
              </div>

              <!-- Jika Input Kas Langsung (Jalur VIP Bendahara) -->
              <div
                v-else
                class="flex items-center gap-1 text-[10px] font-medium text-indigo-400/80 mt-1"
                title="Input Langsung Bendahara"
              >
                <Zap :size="12" />
                <span>Kas Langsung</span>
              </div>
            </td>

            <td class="py-3 px-4">
              <div class="font-medium text-slate-700 dark:text-slate-200">
                {{ trx.keterangan }}
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">
                {{ trx.kategori }}
                <span v-if="trx.seksi">• {{ trx.seksi }}</span>
              </div>
            </td>
            <td
              class="py-3 px-4 text-right font-medium text-emerald-600 bg-emerald-50/10 dark:bg-emerald-900/5"
            >
              {{ trx.tipe === "pemasukan" ? formatRupiah(trx.jumlah) : "-" }}
            </td>
            <td
              class="py-3 px-4 text-right font-medium text-rose-600 bg-rose-50/10 dark:bg-rose-900/5"
            >
              {{ trx.tipe === "pengeluaran" ? formatRupiah(trx.jumlah) : "-" }}
            </td>
            <td v-if="canDeleteTransaction()" class="py-3 px-4 text-center">
              <button
                @click="openDeleteConfirm(trx.id)"
                class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-all opacity-50 group-hover:opacity-100"
                title="Hapus"
              >
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="filteredLaporan.length === 0">
            <td
              :colspan="canDeleteTransaction() ? 5 : 4"
              class="py-12 text-center text-slate-400 text-sm italic"
            >
              Tidak ada data transaksi yang sesuai.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
