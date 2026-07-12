<!--
  Tujuan: Entry view keuangan admin aktif (`/admin/finance`) berbasis recomposition V2 dengan kontrak kas existing.
  Caller: src/router/index.ts (route `admin-finance`).
  Dependensi: useKas, authStore, permission helpers, ConfirmModal, DatePicker/select shadcn-vue, vue-sonner.
  Main Functions: render laporan/approval/input/proposal kas dan orkestrasi aksi approve/reject/delete/submit.
  Side Effects: load data kas saat mount, listener klik global untuk close dropdown, mutasi data via API kas.
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  FileText, ShieldCheck, Plus, ClipboardList, Wallet,
  Trash2, Filter, CheckCircle, Zap,
  Clock, Ban, XCircle, ArrowUpRight, ArrowDownRight, Save,
} from "lucide-vue-next";
import { useKas } from "../../composables/admin/useKas";
import { useAuthStore } from "../../stores/authStore";
import { canAccessKasInput, canViewProposalTab, canDelete } from "../../utils/permissions";
import { toast } from "vue-sonner";
import ConfirmModal from "../../components/ui/ConfirmModal.vue";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import DatePicker from "../../components/ui/datepicker/DatePicker.vue";

const {
  activeTab,
  pendingTransactions,
  rejectedTransactions,
  loadData,
  closeDropdowns,
  formatRupiah,
  formatWaktuAudit,
  globalSaldoAwal,
  globalMasuk,
  globalKeluar,
  globalSaldoAkhir,
  filteredLaporan,
  filteredMasuk,
  filteredKeluar,
  handleDelete,
  selectedMonth,
  selectedYear,
  availableYears,
  filterTipe,
  filterKategori,
  categories,
  handleAction,
  formInput,
  filteredCategoriesInput,
  sections,
  isLoading,
  handleDirectInput,
  formatInputRupiah,
  parseInputRupiah,
  formProposal,
  filteredCategoriesProposal,
  methods,
  handleProposal
} = useKas();

const authStore = useAuthStore();

// --- STATE: REPORT (LAPORAN) ---
const months = [
  { value: 1, name: "Januari" }, { value: 2, name: "Februari" }, { value: 3, name: "Maret" },
  { value: 4, name: "April" }, { value: 5, name: "Mei" }, { value: 6, name: "Juni" },
  { value: 7, name: "Juli" }, { value: 8, name: "Agustus" }, { value: 9, name: "September" },
  { value: 10, name: "Oktober" }, { value: 11, name: "November" }, { value: 12, name: "Desember" }
];

const resetFilters = () => {
  selectedMonth.value = new Date().getMonth() + 1;
  selectedYear.value = new Date().getFullYear();
  filterTipe.value = 'semua';
  filterKategori.value = 'semua';
};

const isDeleteModalOpen = ref(false);
const selectedDeleteId = ref<number | null>(null);
const canDeleteTransaction = () => canDelete(authStore.user?.role);

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

// --- STATE: APPROVAL ---
const listKetua = computed(() => pendingTransactions.value.filter((t: any) => t.status === "pending_ketua"));
const listBendahara = computed(() => pendingTransactions.value.filter((t: any) => t.status === "pending_bendahara"));
const listRejected = computed(() => rejectedTransactions.value);

const isBendahara = computed(() => authStore.user?.role === "bendahara");
const isKetua = computed(() => authStore.user?.role === "ketua");
const isSuperadmin = computed(() => authStore.user?.role === "superadmin");

const isActionModalOpen = ref(false);
const actionModalData = ref({ id: 0, action: "" as "approve" | "reject", currentStatus: "" });

const openActionConfirm = (id: number, action: "approve" | "reject", currentStatus: string) => {
  actionModalData.value = { id, action, currentStatus };
  isActionModalOpen.value = true;
};
const executeAction = async () => {
  try {
    isActionModalOpen.value = false;
    await handleAction(actionModalData.value.id, actionModalData.value.action);
    if (actionModalData.value.action === "approve") {
      if (actionModalData.value.currentStatus === "pending_bendahara") {
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

// --- STATE: KAS INPUT ---
const validationInput = ref({ kategori: false, jumlah: false, tanggal: false, keterangan: false });
const isInputModalOpen = ref(false);
const inputConfirmMsg = ref("");

const submitInputForm = async () => {
  validationInput.value = { kategori: false, jumlah: false, tanggal: false, keterangan: false };
  let hasError = false;
  if (!formInput.value.kategori_id) { validationInput.value.kategori = true; hasError = true; }
  if (!formInput.value.jumlah || parseInputRupiah(formInput.value.jumlah) <= 0) { validationInput.value.jumlah = true; hasError = true; }
  if (!formInput.value.tanggal) { validationInput.value.tanggal = true; hasError = true; }
  if (!formInput.value.keterangan || formInput.value.keterangan.trim() === "") { validationInput.value.keterangan = true; hasError = true; }
  
  if (hasError) return toast.error("Silakan lengkapi kolom yang ditandai merah.");
  
  const namaKategori = filteredCategoriesInput.value.find((c: any) => c.id === formInput.value.kategori_id)?.nama_kategori || "-";
  const nominalRp = formatRupiah(parseInputRupiah(formInput.value.jumlah));
  
  inputConfirmMsg.value = `Anda akan menyimpan transaksi ${formInput.value.tipe.toUpperCase()} sebesar ${nominalRp} untuk kategori ${namaKategori}. Apakah data sudah benar dan ingin disimpan?`;
  isInputModalOpen.value = true;
};
const executeInputSubmit = async () => {
  isInputModalOpen.value = false;
  try {
    await handleDirectInput();
    toast.success("Transaksi Kas Baru berhasil disimpan!");
  } catch (error: any) {
    toast.error(error.message || "Gagal menyimpan transaksi.");
  }
};

// --- STATE: PROPOSAL ---
const validationProp = ref({ kategori: false, seksi: false, jumlah: false, tanggal: false, keterangan: false });
const isPropModalOpen = ref(false);
const propConfirmMsg = ref("");

const submitProposalForm = async () => {
  validationProp.value = { kategori: false, seksi: false, jumlah: false, tanggal: false, keterangan: false };
  let hasError = false;
  if (!formProposal.value.kategori_id) { validationProp.value.kategori = true; hasError = true; }
  if (!formProposal.value.seksi_id) { validationProp.value.seksi = true; hasError = true; }
  if (!formProposal.value.jumlah || parseInputRupiah(formProposal.value.jumlah) <= 0) { validationProp.value.jumlah = true; hasError = true; }
  if (!formProposal.value.tanggal) { validationProp.value.tanggal = true; hasError = true; }
  if (!formProposal.value.keterangan || formProposal.value.keterangan.trim() === "") { validationProp.value.keterangan = true; hasError = true; }
  
  if (hasError) return toast.error("Silakan lengkapi kolom yang ditandai merah.");
  
  const namaKategori = filteredCategoriesProposal.value.find((c: any) => c.id === formProposal.value.kategori_id)?.nama_kategori || "-";
  const namaSeksi = sections.value.find((s: any) => s.id === formProposal.value.seksi_id)?.nama_seksi || "-";
  const nominalRp = formatRupiah(parseInputRupiah(formProposal.value.jumlah));
  
  propConfirmMsg.value = `Anda akan mengajukan proposal dana sebesar ${nominalRp} untuk keperluan ${namaKategori} (Seksi: ${namaSeksi}). Lanjutkan pengajuan?`;
  isPropModalOpen.value = true;
};
const executeProposalSubmit = async () => {
  isPropModalOpen.value = false;
  try {
    await handleProposal();
    toast.success("Proposal berhasil diajukan dan masuk ke antrean persetujuan!");
  } catch (error: any) {
    toast.error(error.message || "Gagal mengajukan proposal.");
  }
};

// --- LIFECYCLES ---
const handleGlobalClick = () => {
  closeDropdowns();
};

onMounted(() => {
  loadData();
  document.addEventListener("click", handleGlobalClick);
});
onUnmounted(() => {
  document.removeEventListener("click", handleGlobalClick);
});
</script>

<template>
  <div class="space-y-4 pb-20 max-w-[1400px] mx-auto">
    
    <!-- MODALS -->
    <ConfirmModal :isOpen="isDeleteModalOpen" @close="isDeleteModalOpen = false" @confirm="executeDelete" title="Hapus Transaksi?" message="Data transaksi ini akan dihapus secara permanen dari buku kas dan tidak dapat dikembalikan. Lanjutkan?" type="danger" confirmText="Ya, Hapus Permanen" />
    <ConfirmModal :isOpen="isActionModalOpen" @close="isActionModalOpen = false" @confirm="executeAction" :title="actionModalData.action === 'approve' ? (actionModalData.currentStatus === 'pending_bendahara' ? 'Cairkan Dana?' : 'Setujui Proposal?') : 'Tolak Proposal?'" :message="actionModalData.action === 'approve' ? (actionModalData.currentStatus === 'pending_bendahara' ? 'Dana akan dipotong dari kas dan dicatat per hari ini.' : 'Proposal akan diteruskan ke antrean Bendahara.') : 'Proposal ini akan dibatalkan dan masuk ke riwayat penolakan.'" :type="actionModalData.action === 'approve' ? 'success' : 'danger'" :confirmText="actionModalData.action === 'approve' ? (actionModalData.currentStatus === 'pending_bendahara' ? 'Ya, Cairkan' : 'Ya, Setujui') : 'Ya, Tolak'" />
    <ConfirmModal :isOpen="isInputModalOpen" @close="isInputModalOpen = false" @confirm="executeInputSubmit" title="Simpan Transaksi Kas?" :message="inputConfirmMsg" type="success" confirmText="Ya, Simpan" />
    <ConfirmModal :isOpen="isPropModalOpen" @close="isPropModalOpen = false" @confirm="executeProposalSubmit" title="Ajukan Proposal?" :message="propConfirmMsg" type="success" confirmText="Ya, Ajukan" />

    <!-- HEADER -->
    <header class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Financial Management
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Kelola arus kas, proposal, dan persetujuan dana masjid.
        </p>
      </div>
    </header>

    <!-- SUMMARY CARDS (Dense & Premium) -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800/60 dark:bg-[#09090b]/70 flex flex-col justify-between">
        <div class="flex items-start justify-between pb-2">
          <p class="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">Saldo Awal Bulan</p>
          <FileText :size="16" class="text-slate-400" />
        </div>
        <h3 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 truncate" :title="formatRupiah(globalSaldoAwal)">
          {{ formatRupiah(globalSaldoAwal) }}
        </h3>
      </div>

      <div class="rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800/60 dark:bg-[#09090b]/70 flex flex-col justify-between">
        <div class="flex items-start justify-between pb-2">
          <p class="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">Pemasukan Bulan Ini</p>
          <ArrowUpRight :size="16" class="text-emerald-500" />
        </div>
        <h3 class="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 truncate" :title="formatRupiah(globalMasuk)">
          + {{ formatRupiah(globalMasuk) }}
        </h3>
      </div>

      <div class="rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800/60 dark:bg-[#09090b]/70 flex flex-col justify-between">
        <div class="flex items-start justify-between pb-2">
          <p class="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">Pengeluaran Bulan Ini</p>
          <ArrowDownRight :size="16" class="text-rose-500" />
        </div>
        <h3 class="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 truncate" :title="formatRupiah(globalKeluar)">
          - {{ formatRupiah(globalKeluar) }}
        </h3>
      </div>

      <div class="rounded-xl border border-brand-green/30 bg-brand-green/5 backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-shadow dark:border-brand-green/20 dark:bg-brand-green/10 flex flex-col justify-between">
        <div class="flex items-start justify-between pb-2">
          <p class="text-sm font-bold tracking-tight text-brand-green dark:text-emerald-400">Sisa Saldo Kas</p>
          <Wallet :size="16" class="text-brand-green" />
        </div>
        <h3 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 truncate" :title="formatRupiah(globalSaldoAkhir)">
          {{ formatRupiah(globalSaldoAkhir) }}
        </h3>
      </div>
    </div>

    <!-- MAIN SECTION: SEGMENTED CONTROLS & CONTENT -->
    <div class="bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-xl rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col">
      
      <!-- Dense Segmented Control -->
      <div class="p-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
        <div class="flex h-9 items-center justify-start md:justify-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 dark:text-slate-400 overflow-x-auto hide-scrollbar w-full md:w-auto">
          <button @click="activeTab = 'laporan'" :class="activeTab === 'laporan' ? 'bg-white text-brand-green shadow-sm dark:bg-[#09090b] dark:text-brand-green' : 'hover:bg-brand-accent/5 hover:text-slate-900 dark:hover:bg-brand-accent/10 dark:hover:text-slate-50'" class="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 min-w-[100px]">
            <FileText :size="14" class="mr-1.5" /> Laporan
          </button>
          
          <button @click="activeTab = 'approval'" :class="activeTab === 'approval' ? 'bg-white text-brand-green shadow-sm dark:bg-[#09090b] dark:text-brand-green' : 'hover:bg-brand-accent/5 hover:text-slate-900 dark:hover:bg-brand-accent/10 dark:hover:text-slate-50'" class="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 min-w-[100px]">
            <ShieldCheck :size="14" class="mr-1.5" /> Approval
            <span v-if="pendingTransactions.length > 0" class="ml-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
              {{ pendingTransactions.length }}
            </span>
          </button>

          <button v-if="canAccessKasInput(authStore.user?.role)" @click="activeTab = 'input'" :class="activeTab === 'input' ? 'bg-white text-brand-green shadow-sm dark:bg-[#09090b] dark:text-brand-green' : 'hover:bg-brand-accent/5 hover:text-slate-900 dark:hover:bg-brand-accent/10 dark:hover:text-slate-50'" class="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 min-w-[100px]">
            <Plus :size="14" class="mr-1.5" /> Kas Baru
          </button>

          <button v-if="canViewProposalTab(authStore.user?.role)" @click="activeTab = 'proposal'" :class="activeTab === 'proposal' ? 'bg-white text-brand-green shadow-sm dark:bg-[#09090b] dark:text-brand-green' : 'hover:bg-brand-accent/5 hover:text-slate-900 dark:hover:bg-brand-accent/10 dark:hover:text-slate-50'" class="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 min-w-[100px]">
            <ClipboardList :size="14" class="mr-1.5" /> Proposal
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="p-4 md:p-6 min-h-[400px]">
        
        <!-- ========================================= -->
        <!-- TAB 1: LAPORAN -->
        <!-- ========================================= -->
        <div v-if="activeTab === 'laporan'" class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          <!-- Compact Toolbar Filters with Shadcn Select -->
          <div class="flex flex-col md:flex-row items-center gap-2">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 w-full">
              <!-- Bulan -->
              <Select :model-value="selectedMonth?.toString()" @update:model-value="(val) => selectedMonth = Number(val)">
                <SelectTrigger class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent class="z-[100]">
                  <SelectGroup>
                    <SelectItem v-for="m in months" :key="m.value" :value="m.value.toString()">
                      {{ m.name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <!-- Tahun -->
              <Select :model-value="selectedYear?.toString()" @update:model-value="(val) => selectedYear = Number(val)">
                <SelectTrigger class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent class="z-[100]">
                  <SelectGroup>
                    <SelectItem v-for="y in availableYears" :key="y" :value="y.toString()">
                      {{ y }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <!-- Tipe -->
              <Select v-model="filterTipe">
                <SelectTrigger class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent class="z-[100]">
                  <SelectGroup>
                    <SelectItem value="semua">Semua Tipe</SelectItem>
                    <SelectItem value="pemasukan" class="text-emerald-600 dark:text-emerald-400">Pemasukan</SelectItem>
                    <SelectItem value="pengeluaran" class="text-rose-600 dark:text-rose-400">Pengeluaran</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <!-- Kategori -->
              <Select :model-value="filterKategori?.toString()" @update:model-value="(val) => filterKategori = val === 'semua' ? 'semua' : Number(val)">
                <SelectTrigger class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent class="z-[100]">
                  <SelectGroup>
                    <SelectItem value="semua">Semua Kategori</SelectItem>
                    <SelectItem v-for="c in categories" :key="c.id" :value="c.id.toString()">
                      {{ c.nama_kategori || c.name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <button @click="resetFilters" class="w-full md:w-auto h-9 px-4 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors shadow-sm shrink-0 text-slate-600 dark:text-slate-300">
              <Filter :size="14" class="mr-2 opacity-70" /> Reset
            </button>
          </div>

          <!-- Compact & Responsive Table Laporan -->
          <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] overflow-hidden shadow-sm">
            <div class="w-full overflow-x-auto">
              <table class="w-full min-w-[700px] caption-bottom text-sm whitespace-nowrap md:whitespace-normal">
                <thead class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <tr class="transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                    <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 w-[180px]">Tanggal</th>
                    <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 min-w-[200px]">Keterangan</th>
                    <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[140px]">Debit</th>
                    <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[140px]">Kredit</th>
                    <th v-if="canDeleteTransaction()" class="h-10 px-4 text-center align-middle font-medium text-slate-500 w-[60px]"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="trx in filteredLaporan" :key="trx.id" class="border-b border-slate-100 dark:border-slate-800/50 transition-colors hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10 group">
                    <td class="p-4 align-top">
                      <div class="font-medium whitespace-nowrap">{{ trx.tanggal }}</div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 whitespace-nowrap">
                        <template v-if="trx.approved_at">
                          <CheckCircle :size="12" :class="trx.tipe === 'pengeluaran' ? 'text-rose-500' : 'text-emerald-500'" />
                          {{ trx.tipe === "pengeluaran" ? "Cair" : "Masuk" }}: {{ formatWaktuAudit(trx.approved_at).split(' ')[1] || formatWaktuAudit(trx.approved_at) }}
                        </template>
                        <template v-else>
                          <Zap :size="12" class="text-indigo-500" /> Kas Langsung
                        </template>
                      </div>
                    </td>
                    <td class="p-4 align-top">
                      <div class="leading-relaxed whitespace-normal min-w-[200px]">{{ trx.keterangan }}</div>
                      <div class="flex flex-wrap items-center gap-2 mt-1.5">
                        <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">{{ trx.kategori }}</span>
                        <span v-if="trx.seksi" class="text-xs text-slate-400 whitespace-nowrap">&bull; {{ trx.seksi }}</span>
                      </div>
                    </td>
                    <td class="p-4 text-right align-top text-emerald-600 dark:text-emerald-400 font-medium">
                      {{ trx.tipe === "pemasukan" ? formatRupiah(trx.jumlah) : "-" }}
                    </td>
                    <td class="p-4 text-right align-top text-rose-600 dark:text-rose-400 font-medium">
                      {{ trx.tipe === "pengeluaran" ? formatRupiah(trx.jumlah) : "-" }}
                    </td>
                    <td v-if="canDeleteTransaction()" class="p-4 text-center align-top">
                      <button @click="openDeleteConfirm(trx.id)" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-8 w-8 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 md:opacity-0 opacity-100 dark:hover:bg-slate-800" title="Hapus">
                        <Trash2 :size="16" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="filteredLaporan.length === 0">
                    <td :colspan="canDeleteTransaction() ? 5 : 4" class="p-8 text-center text-slate-500">
                      Belum ada transaksi yang sesuai kriteria filter.
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="filteredLaporan.length > 0" class="bg-slate-50/50 dark:bg-slate-900/30 font-medium">
                  <tr>
                    <td colspan="2" class="p-4 text-right">Total Transaksi Filtered:</td>
                    <td class="p-4 text-right text-emerald-600 dark:text-emerald-400">{{ formatRupiah(filteredMasuk) }}</td>
                    <td class="p-4 text-right text-rose-600 dark:text-rose-400">{{ formatRupiah(filteredKeluar) }}</td>
                    <td v-if="canDeleteTransaction()"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================= -->
        <!-- TAB 2: APPROVAL -->
        <!-- ========================================= -->
        <div v-else-if="activeTab === 'approval'" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          <!-- Ketua -->
          <div class="space-y-2" :class="isSuperadmin || isKetua ? 'order-1' : 'order-2 opacity-50 grayscale pointer-events-none select-none'">
            <h3 class="font-medium text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 px-1">
              <Clock :size="14" class="text-amber-500" /> Tahap 1: Verifikasi Ketua
            </h3>
            
            <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] overflow-hidden shadow-sm">
              <div class="w-full overflow-x-auto">
                <table class="w-full min-w-[700px] caption-bottom text-sm whitespace-nowrap md:whitespace-normal">
                  <thead class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <tr>
                      <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 w-[150px]">Tgl & Jenis</th>
                      <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 min-w-[200px]">Rincian Proposal</th>
                      <th class="h-10 px-4 text-left align-middle font-medium text-slate-500">Seksi</th>
                      <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[140px]">Nominal</th>
                      <th v-if="isKetua || isSuperadmin" class="h-10 px-4 text-center align-middle font-medium text-slate-500 w-[100px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
                    <tr v-for="trx in listKetua" :key="trx.id" class="transition-colors hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10">
                      <td class="p-4 align-top">
                        <div class="font-medium">{{ trx.tanggal }}</div>
                        <div class="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold mt-1" :class="trx.tipe === 'pemasukan' ? 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'">
                          {{ trx.tipe === "pemasukan" ? "MASUK" : "KELUAR" }}
                        </div>
                      </td>
                      <td class="p-4 align-top">
                        <div class="whitespace-normal">{{ trx.keterangan }}</div>
                        <div class="mt-1 text-xs text-slate-500">{{ trx.kategori }}</div>
                      </td>
                      <td class="p-4 align-top text-slate-500">{{ trx.seksi || "-" }}</td>
                      <td class="p-4 align-top font-medium text-right">{{ formatRupiah(trx.jumlah) }}</td>
                      <td v-if="isKetua || isSuperadmin" class="p-4 align-top">
                        <div class="flex justify-center gap-2">
                          <button @click="openActionConfirm(trx.id, 'approve', trx.status)" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-8 w-8 text-emerald-600 dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Setujui"><CheckCircle :size="16" /></button>
                          <button @click="openActionConfirm(trx.id, 'reject', trx.status)" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-8 w-8 text-rose-600 dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Tolak"><XCircle :size="16" /></button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="listKetua.length === 0"><td :colspan="isKetua || isSuperadmin ? 5 : 4" class="p-8 text-center text-slate-500">Antrean bersih.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Bendahara -->
          <div class="space-y-2 mt-6" :class="isSuperadmin || isBendahara ? 'order-1' : 'order-2 opacity-50 grayscale pointer-events-none select-none'">
            <h3 class="font-medium text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 px-1">
              <Wallet :size="14" class="text-indigo-500" /> Tahap 2: Antrean Pencairan (Bendahara)
            </h3>
            
            <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] overflow-hidden shadow-sm">
              <div class="w-full overflow-x-auto">
                <table class="w-full min-w-[700px] caption-bottom text-sm whitespace-nowrap md:whitespace-normal">
                  <thead class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <tr>
                      <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 w-[150px]">Tgl & Jenis</th>
                      <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 min-w-[200px]">Rincian Pencairan</th>
                      <th class="h-10 px-4 text-left align-middle font-medium text-slate-500">Seksi</th>
                      <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[140px]">Nominal</th>
                      <th v-if="isBendahara || isSuperadmin" class="h-10 px-4 text-center align-middle font-medium text-slate-500 w-[140px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
                    <tr v-for="trx in listBendahara" :key="trx.id" class="transition-colors hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10">
                      <td class="p-4 align-top">
                        <div class="font-medium">{{ trx.tanggal }}</div>
                        <div class="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold mt-1" :class="trx.tipe === 'pemasukan' ? 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'">
                          {{ trx.tipe === "pemasukan" ? "MASUK" : "KELUAR" }}
                        </div>
                      </td>
                      <td class="p-4 align-top">
                        <div class="whitespace-normal">{{ trx.keterangan }}</div>
                        <div class="mt-1 text-xs text-slate-500">{{ trx.kategori }}</div>
                      </td>
                      <td class="p-4 align-top text-slate-500">{{ trx.seksi || "-" }}</td>
                      <td class="p-4 align-top font-medium text-right">{{ formatRupiah(trx.jumlah) }}</td>
                      <td v-if="isBendahara || isSuperadmin" class="p-4 align-top">
                        <div class="flex justify-center gap-2">
                          <button @click="openActionConfirm(trx.id, 'approve', trx.status)" class="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors hover:bg-brand-accent/90 h-8 px-3 bg-brand-accent text-white shadow-sm">Cairkan</button>
                          <button @click="openActionConfirm(trx.id, 'reject', trx.status)" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-brand-accent/5 hover:text-slate-900 h-8 w-8 text-rose-600 dark:hover:bg-brand-accent/10 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Tolak"><XCircle :size="16" /></button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="listBendahara.length === 0"><td :colspan="isBendahara || isSuperadmin ? 5 : 4" class="p-8 text-center text-slate-500">Antrean bersih.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Rejected -->
          <div v-if="listRejected.length > 0" class="space-y-2 mt-6 opacity-80">
            <h3 class="font-medium text-sm text-slate-500 flex items-center gap-2 px-1">
              <Ban :size="14" /> Riwayat Penolakan
            </h3>
            <div class="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div class="w-full overflow-x-auto">
                <table class="w-full min-w-[500px] caption-bottom text-sm whitespace-nowrap">
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
                    <tr v-for="trx in listRejected" :key="trx.id" class="bg-slate-50/30 dark:bg-slate-900/10">
                      <td class="p-3 text-slate-500 w-[120px]">{{ trx.tanggal }}</td>
                      <td class="p-3 text-slate-400 line-through whitespace-normal">{{ trx.keterangan }}</td>
                      <td class="p-3 text-right text-slate-500">{{ formatRupiah(trx.jumlah) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================= -->
        <!-- TAB 3: KAS BARU (INPUT) -->
        <!-- ========================================= -->
        <div v-else-if="activeTab === 'input'" class="max-w-2xl mx-auto py-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          <form @submit.prevent="submitInputForm" class="space-y-6">
            
            <div class="space-y-4">
              <!-- Jenis Transaksi (Segmented Toggle) -->
              <div class="space-y-1.5">
                <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Jenis Transaksi Kas</label>
                <div class="inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800/50 p-1 text-slate-500 dark:text-slate-400">
                  <label class="relative flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all" :class="formInput.tipe === 'pemasukan' ? 'bg-white text-emerald-600 ring-1 ring-emerald-500 shadow-sm dark:bg-[#09090b] dark:text-emerald-400 dark:ring-emerald-500' : 'hover:bg-brand-accent/5 hover:text-slate-900 dark:hover:bg-brand-accent/10 dark:hover:text-slate-50'">
                    <input type="radio" v-model="formInput.tipe" value="pemasukan" class="hidden" />
                    Pemasukan
                  </label>
                  <label class="relative flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all" :class="formInput.tipe === 'pengeluaran' ? 'bg-white text-rose-600 ring-1 ring-rose-500 shadow-sm dark:bg-[#09090b] dark:text-rose-400 dark:ring-rose-500' : 'hover:bg-brand-accent/5 hover:text-slate-900 dark:hover:bg-brand-accent/10 dark:hover:text-slate-50'">
                    <input type="radio" v-model="formInput.tipe" value="pengeluaran" class="hidden" />
                    Pengeluaran
                  </label>
                </div>
              </div>

              <!-- Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Kategori Transaksi</label>
                  <Select :model-value="formInput.kategori_id?.toString()" @update:model-value="(val) => { formInput.kategori_id = Number(val); validationInput.kategori = false; }">
                    <SelectTrigger class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800" :class="validationInput.kategori ? 'border-rose-500 ring-1 ring-rose-500' : ''">
                      <SelectValue placeholder="Pilih Kategori..." />
                    </SelectTrigger>
                    <SelectContent class="z-[100]">
                      <SelectGroup>
                        <SelectItem v-for="cat in filteredCategoriesInput" :key="cat.id" :value="cat.id.toString()">
                          {{ cat.nama_kategori }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Tanggal Eksekusi</label>
                  <DatePicker v-model="formInput.tanggal" />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Nominal Rupiah</label>
                  <div class="flex h-9 w-full items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] shadow-sm transition-colors focus-within:ring-1 focus-within:ring-brand-green overflow-hidden" :class="validationInput.jumlah ? 'border-rose-500 ring-1 ring-rose-500' : ''">
                    <div class="px-3 h-full flex items-center bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 text-sm text-slate-500">Rp</div>
                    <input :value="formInput.jumlah" type="text" inputmode="numeric" placeholder="0" @input="formInput.jumlah = formatInputRupiah(($event.target as HTMLInputElement).value); validationInput.jumlah = parseInputRupiah(formInput.jumlah) <= 0;" class="flex-1 h-full px-3 text-sm font-medium bg-transparent outline-none placeholder:text-slate-500" />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Pelapor Seksi <span class="text-slate-500 font-normal">(Opsional)</span></label>
                  <Select :model-value="formInput.seksi_id?.toString() || 'none'" @update:model-value="(val) => formInput.seksi_id = val === 'none' ? null : Number(val)">
                    <SelectTrigger class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <SelectValue placeholder="Tanpa Seksi" />
                    </SelectTrigger>
                    <SelectContent class="z-[100]">
                      <SelectGroup>
                        <SelectItem value="none" class="text-slate-500">-- Tanpa Seksi --</SelectItem>
                        <SelectItem v-for="s in sections" :key="String(s.id)" :value="s.id.toString()">
                          {{ s.nama_seksi }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Keterangan Ringkas</label>
                <textarea v-model="formInput.keterangan" rows="3" placeholder="Contoh: Beli keperluan ATK masjid..." @input="validationInput.keterangan = false" class="flex w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-green disabled:cursor-not-allowed disabled:opacity-50 resize-none" :class="validationInput.keterangan ? 'border-rose-500 ring-1 ring-rose-500' : ''"></textarea>
              </div>
            </div>

            <button type="submit" :disabled="isLoading" class="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-brand-green/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-green disabled:pointer-events-none disabled:opacity-50 w-full">
              <Save v-if="!isLoading" :size="16" class="mr-2" />
              <div v-else class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Simpan Langsung ke Buku Kas
            </button>
          </form>
        </div>

        <!-- ========================================= -->
        <!-- TAB 4: PROPOSAL (MINTA DANA) -->
        <!-- ========================================= -->
        <div v-else-if="activeTab === 'proposal'" class="max-w-2xl mx-auto py-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          <form @submit.prevent="submitProposalForm" class="space-y-6">
            
            <div class="space-y-4">
              <!-- Jenis Transaksi (Segmented Toggle) -->
              <div class="space-y-1.5">
                <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Tujuan Pengajuan</label>
                <div class="inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800/50 p-1 text-slate-500 dark:text-slate-400">
                  <label class="relative flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all" :class="formProposal.tipe === 'pemasukan' ? 'bg-white text-emerald-600 ring-1 ring-emerald-500 shadow-sm dark:bg-[#09090b] dark:text-emerald-400 dark:ring-emerald-500' : 'hover:bg-brand-accent/5 hover:text-slate-900 dark:hover:bg-brand-accent/10 dark:hover:text-slate-50'">
                    <input type="radio" v-model="formProposal.tipe" value="pemasukan" class="hidden" />
                    Lapor Setoran
                  </label>
                  <label class="relative flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all" :class="formProposal.tipe === 'pengeluaran' ? 'bg-white text-rose-600 ring-1 ring-rose-500 shadow-sm dark:bg-[#09090b] dark:text-rose-400 dark:ring-rose-500' : 'hover:bg-brand-accent/5 hover:text-slate-900 dark:hover:bg-brand-accent/10 dark:hover:text-slate-50'">
                    <input type="radio" v-model="formProposal.tipe" value="pengeluaran" class="hidden" />
                    Minta Dana Keluar
                  </label>
                </div>
              </div>

              <!-- Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Kategori Peruntukan</label>
                  <Select :model-value="formProposal.kategori_id?.toString()" @update:model-value="(val) => { formProposal.kategori_id = Number(val); validationProp.kategori = false; }">
                    <SelectTrigger class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800" :class="validationProp.kategori ? 'border-rose-500 ring-1 ring-rose-500' : ''">
                      <SelectValue placeholder="Pilih Kategori..." />
                    </SelectTrigger>
                    <SelectContent class="z-[100]">
                      <SelectGroup>
                        <SelectItem v-for="cat in filteredCategoriesProposal" :key="cat.id" :value="cat.id.toString()">
                          {{ cat.nama_kategori }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Tanggal Realisasi</label>
                  <DatePicker v-model="formProposal.tanggal" />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Estimasi Nominal</label>
                  <div class="flex h-9 w-full items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] shadow-sm transition-colors focus-within:ring-1 focus-within:ring-brand-green overflow-hidden" :class="validationProp.jumlah ? 'border-rose-500 ring-1 ring-rose-500' : ''">
                    <div class="px-3 h-full flex items-center bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 text-sm text-slate-500">Rp</div>
                    <input :value="formProposal.jumlah" type="text" inputmode="numeric" placeholder="0" @input="formProposal.jumlah = formatInputRupiah(($event.target as HTMLInputElement).value); validationProp.jumlah = parseInputRupiah(formProposal.jumlah) <= 0;" class="flex-1 h-full px-3 text-sm font-medium bg-transparent outline-none placeholder:text-slate-500" />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Seksi Pengaju</label>
                  <Select :model-value="formProposal.seksi_id?.toString()" @update:model-value="(val) => { formProposal.seksi_id = Number(val); validationProp.seksi = false; }">
                    <SelectTrigger class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800" :class="validationProp.seksi ? 'border-rose-500 ring-1 ring-rose-500' : ''">
                      <SelectValue placeholder="Pilih Seksi..." />
                    </SelectTrigger>
                    <SelectContent class="z-[100]">
                      <SelectGroup>
                        <SelectItem v-for="s in sections" :key="String(s.id)" :value="s.id.toString()">
                          {{ s.nama_seksi }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5 md:col-span-2">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Metode Pencairan</label>
                  <Select :model-value="formProposal.metode" @update:model-value="(val) => formProposal.metode = val as string">
                    <SelectTrigger class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <SelectValue placeholder="Pilih Metode..." />
                    </SelectTrigger>
                    <SelectContent class="z-[100]">
                      <SelectGroup>
                        <SelectItem v-for="m in methods" :key="m.id" :value="m.id.toString()">
                          {{ m.name }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Rincian Keperluan</label>
                <textarea v-model="formProposal.keterangan" rows="4" placeholder="Tuliskan secara lengkap rincian barang/jasa yang dibutuhkan..." @input="validationProp.keterangan = false" class="flex w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-green disabled:cursor-not-allowed disabled:opacity-50 resize-none" :class="validationProp.keterangan ? 'border-rose-500 ring-1 ring-rose-500' : ''"></textarea>
              </div>
            </div>

            <button type="submit" :disabled="isLoading" class="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-brand-green/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-green disabled:pointer-events-none disabled:opacity-50 w-full">
              <ClipboardList v-if="!isLoading" :size="16" class="mr-2" />
              <div v-else class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Kirim Pengajuan Proposal
            </button>
          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
