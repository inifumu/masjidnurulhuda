<!--
  Tujuan: Entry view keuangan admin aktif (`/admin/finance`) berbasis recomposition V2 dengan kontrak kas existing.
  Caller: src/router/index.ts (route `admin-finance`).
  Dependensi: useKas, authStore, permission helpers, ConfirmModal, DatePicker/select shadcn-vue, vue-sonner.
  Main Functions: render laporan/approval/input/proposal kas dan orkestrasi aksi approve/reject/delete/submit.
  Side Effects: load data kas saat mount, listener klik global untuk close dropdown, mutasi data via API kas.
-->
<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import {
  FileText, ShieldCheck, Plus, ClipboardList, Wallet,
  Filter, CheckCircle, Zap,
  Clock, Ban, XCircle, ArrowUpRight, ArrowDownRight, Save,
} from "lucide-vue-next";
import { useKas } from "../../composables/admin/useKas";
import { useAuthStore } from "../../stores/authStore";
import { canAccessKasInput, canViewProposalTab, canVoid } from "../../utils/permissions";
import { toast } from "vue-sonner";
import ConfirmModal from "../../components/ui/ConfirmModal.vue";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import DatePicker from "../../components/ui/datepicker/DatePicker.vue";
import TransactionAuditDialog from "../../components/admin/kas/TransactionAuditDialog.vue";
import { kasService, type TransactionAuditTimeline } from "../../services/admin/kasService";
import { ApiError } from "../../services/httpClient";
import { getErrorMessage, type FieldErrorMap } from "../../../shared/contracts/index";

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
  handleVoid,
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
  isLoadingData,
  loadError,
  hasLoadedData,
  pendingMutationIds,
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

const isVoidModalOpen = ref(false);
const selectedVoidId = ref<number | null>(null);
const voidReason = ref("");
const mutationPending = ref(false);
const auditMode = ref<"void" | "reject" | "timeline">("void");
const timeline = ref<TransactionAuditTimeline | null>(null);
const timelineError = ref("");
const auditTriggerSelector = ref("");
const canVoidTransaction = () => canVoid(authStore.user?.role);
const bestEffortReload = async () => {
  try { await loadData(); } catch { /* state error ditangani composable */ }
};

const closeAuditDialog = () => {
  isVoidModalOpen.value = false;
  requestAnimationFrame(() => document.querySelector<HTMLElement>(auditTriggerSelector.value)?.focus());
};

const openVoidConfirm = (id: number) => {
  auditTriggerSelector.value = `[data-audit-trigger="void-${id}"]`;
  selectedVoidId.value = id;
  voidReason.value = "";
  auditMode.value = "void";
  isVoidModalOpen.value = true;
};
const executeVoid = async () => {
  const reason = voidReason.value.trim();
  if (!selectedVoidId.value || reason.length < 10 || reason.length > 500) {
    return toast.error("Alasan pembatalan wajib 10-500 karakter.");
  }
  try {
    mutationPending.value = true;
    await handleVoid(selectedVoidId.value, reason);
    isVoidModalOpen.value = false;
    toast.success("Transaksi berhasil dibatalkan dan tetap tersimpan di histori.");
  } catch (error: unknown) {
    toast.error(getErrorMessage(error, "Gagal membatalkan transaksi."));
    if (error instanceof ApiError && error.status === 409) await bestEffortReload();
  } finally {
    mutationPending.value = false;
  }
};

const openTimeline = async (id: number) => {
  auditTriggerSelector.value = `[data-audit-trigger="timeline-${id}"]`;
  selectedVoidId.value = id;
  auditMode.value = "timeline";
  timeline.value = null;
  timelineError.value = "";
  isVoidModalOpen.value = true;
  try { timeline.value = await kasService.getTransactionTimeline(id); }
  catch (error) { timelineError.value = error instanceof Error ? error.message : "Gagal memuat riwayat."; }
};

// --- STATE: APPROVAL ---
const listKetua = computed(() => pendingTransactions.value.filter((t) => t.status === "pending_ketua"));
const listBendahara = computed(() => pendingTransactions.value.filter((t) => t.status === "pending_bendahara"));
const listRejected = computed(() => rejectedTransactions.value);

const isBendahara = computed(() => authStore.user?.role === "bendahara");
const isKetua = computed(() => authStore.user?.role === "ketua");
const isSuperadmin = computed(() => authStore.user?.role === "superadmin");

const isActionModalOpen = ref(false);
const actionModalData = ref({ id: 0, action: "" as "approve" | "reject", currentStatus: "" });

const openActionConfirm = (id: number, action: "approve" | "reject", currentStatus: string) => {
  actionModalData.value = { id, action, currentStatus };
  if (action === "reject") {
    auditTriggerSelector.value = `[data-audit-trigger="reject-${id}"]`;
    voidReason.value = "";
    auditMode.value = "reject";
    isVoidModalOpen.value = true;
    return;
  }
  isActionModalOpen.value = true;
};
const executeAction = async () => {
  try {
    mutationPending.value = true;
    const reason = actionModalData.value.action === "reject" ? voidReason.value.trim() : undefined;
    await handleAction(actionModalData.value.id, actionModalData.value.action, reason);
    isActionModalOpen.value = false;
    isVoidModalOpen.value = false;
    if (actionModalData.value.action === "approve") {
      if (actionModalData.value.currentStatus === "pending_bendahara") {
        toast.success("Dana berhasil dicairkan & masuk buku kas!");
      } else {
        toast.success("Proposal disetujui, diteruskan ke Bendahara!");
      }
    } else {
      toast.success("Proposal berhasil ditolak!");
    }
  } catch (error: unknown) {
    toast.error(getErrorMessage(error, "Terjadi kesalahan saat memproses data."));
    if (error instanceof ApiError && error.status === 409) await bestEffortReload();
  } finally {
    mutationPending.value = false;
  }
};

// --- STATE: KAS INPUT ---
const validationInput = ref<FieldErrorMap>({});
const isInputModalOpen = ref(false);
const inputConfirmMsg = ref("");

const submitInputForm = async () => {
  validationInput.value = {};
  let hasError = false;
  if (!formInput.value.kategori_id) { validationInput.value.kategori_id = "Kategori wajib dipilih."; hasError = true; }
  if (!formInput.value.jumlah || parseInputRupiah(formInput.value.jumlah) <= 0) { validationInput.value.jumlah = "Nominal harus lebih dari 0."; hasError = true; }
  if (!formInput.value.tanggal) { validationInput.value.tanggal = "Tanggal wajib dipilih."; hasError = true; }
  if (!formInput.value.keterangan || formInput.value.keterangan.trim() === "") { validationInput.value.keterangan = "Keterangan wajib diisi."; hasError = true; }
  
  if (hasError) {
    await nextTick();
    document.getElementById(`input-${Object.keys(validationInput.value)[0]}`)?.focus();
    return toast.error("Silakan lengkapi kolom yang ditandai merah.");
  }

  const namaKategori = filteredCategoriesInput.value.find((c) => c.id === formInput.value.kategori_id)?.nama_kategori || "-";
  const nominalRp = formatRupiah(parseInputRupiah(formInput.value.jumlah));
  
  inputConfirmMsg.value = `Anda akan menyimpan transaksi ${formInput.value.tipe.toUpperCase()} sebesar ${nominalRp} untuk kategori ${namaKategori}. Apakah data sudah benar dan ingin disimpan?`;
  isInputModalOpen.value = true;
};
const executeInputSubmit = async () => {
  try {
    mutationPending.value = true;
    await handleDirectInput();
    isInputModalOpen.value = false;
    toast.success("Transaksi Kas Baru berhasil disimpan!");
  } catch (error: unknown) {
    if (error instanceof ApiError && Object.keys(error.fields).length) {
      validationInput.value = error.fields;
      await nextTick();
      document.getElementById(`input-${Object.keys(error.fields)[0]}`)?.focus();
    }
    toast.error(getErrorMessage(error, "Gagal menyimpan transaksi."));
  } finally {
    mutationPending.value = false;
  }
};

// --- STATE: PROPOSAL ---
const validationProp = ref<FieldErrorMap>({});
const isPropModalOpen = ref(false);
const propConfirmMsg = ref("");

const submitProposalForm = async () => {
  validationProp.value = {};
  let hasError = false;
  if (!formProposal.value.kategori_id) { validationProp.value.kategori_id = "Kategori wajib dipilih."; hasError = true; }
  if (!formProposal.value.seksi_id) { validationProp.value.seksi_id = "Seksi wajib dipilih."; hasError = true; }
  if (!formProposal.value.jumlah || parseInputRupiah(formProposal.value.jumlah) <= 0) { validationProp.value.jumlah = "Nominal harus lebih dari 0."; hasError = true; }
  if (!formProposal.value.tanggal) { validationProp.value.tanggal = "Tanggal wajib dipilih."; hasError = true; }
  if (!formProposal.value.keterangan || formProposal.value.keterangan.trim() === "") { validationProp.value.keterangan = "Keterangan wajib diisi."; hasError = true; }
  
  if (hasError) {
    await nextTick();
    document.getElementById(`proposal-${Object.keys(validationProp.value)[0]}`)?.focus();
    return toast.error("Silakan lengkapi kolom yang ditandai merah.");
  }

  const namaKategori = filteredCategoriesProposal.value.find((c) => c.id === formProposal.value.kategori_id)?.nama_kategori || "-";
  const namaSeksi = sections.value.find((s) => s.id === formProposal.value.seksi_id)?.nama_seksi || "-";
  const nominalRp = formatRupiah(parseInputRupiah(formProposal.value.jumlah));
  
  propConfirmMsg.value = `Anda akan mengajukan proposal dana sebesar ${nominalRp} untuk keperluan ${namaKategori} (Seksi: ${namaSeksi}). Lanjutkan pengajuan?`;
  isPropModalOpen.value = true;
};
const executeProposalSubmit = async () => {
  try {
    mutationPending.value = true;
    await handleProposal();
    isPropModalOpen.value = false;
    toast.success("Proposal berhasil diajukan dan masuk ke antrean persetujuan!");
  } catch (error: unknown) {
    if (error instanceof ApiError && Object.keys(error.fields).length) {
      validationProp.value = error.fields;
      await nextTick();
      document.getElementById(`proposal-${Object.keys(error.fields)[0]}`)?.focus();
    }
    toast.error(getErrorMessage(error, "Gagal mengajukan proposal."));
  } finally {
    mutationPending.value = false;
  }
};

// --- LIFECYCLES ---
const handleGlobalClick = () => {
  closeDropdowns();
};

onMounted(() => {
  void loadData().catch(() => undefined);
  document.addEventListener("click", handleGlobalClick);
});
onUnmounted(() => {
  document.removeEventListener("click", handleGlobalClick);
});
</script>

<template>
  <div class="space-y-4 pb-20 max-w-[1400px] mx-auto">
    
    <!-- MODALS -->
    <TransactionAuditDialog
      :open="isVoidModalOpen" :mode="auditMode" :reason="voidReason" :pending="mutationPending"
      :timeline="timeline" :error="timelineError" @update:reason="voidReason = $event"
      @close="closeAuditDialog" @confirm="auditMode === 'void' ? executeVoid() : executeAction()"
      @retry="selectedVoidId && openTimeline(selectedVoidId)"
    />
    <ConfirmModal :isOpen="isActionModalOpen" :pending="mutationPending" @close="isActionModalOpen = false" @confirm="executeAction" :title="actionModalData.action === 'approve' ? (actionModalData.currentStatus === 'pending_bendahara' ? 'Cairkan Dana?' : 'Setujui Proposal?') : 'Tolak Proposal?'" :message="actionModalData.action === 'approve' ? (actionModalData.currentStatus === 'pending_bendahara' ? 'Dana akan dipotong dari kas dan dicatat per hari ini.' : 'Proposal akan diteruskan ke antrean Bendahara.') : 'Proposal ini akan dibatalkan dan masuk ke riwayat penolakan.'" :type="actionModalData.action === 'approve' ? 'success' : 'danger'" :confirmText="actionModalData.action === 'approve' ? (actionModalData.currentStatus === 'pending_bendahara' ? 'Ya, Cairkan' : 'Ya, Setujui') : 'Ya, Tolak'" />
    <ConfirmModal :isOpen="isInputModalOpen" :pending="mutationPending" @close="isInputModalOpen = false" @confirm="executeInputSubmit" title="Simpan Transaksi Kas?" :message="inputConfirmMsg" type="success" confirmText="Ya, Simpan" />
    <ConfirmModal :isOpen="isPropModalOpen" :pending="mutationPending" @close="isPropModalOpen = false" @confirm="executeProposalSubmit" title="Ajukan Proposal?" :message="propConfirmMsg" type="success" confirmText="Ya, Ajukan" />

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
        <div class="flex min-h-11 items-center justify-start md:justify-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 dark:text-slate-400 overflow-x-auto hide-scrollbar w-full md:w-auto">
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
        <div v-if="isLoadingData && !hasLoadedData" role="status" class="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
          Memuat data keuangan…
        </div>
        <div v-else-if="loadError && !hasLoadedData" role="alert" class="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
          <p class="font-medium text-rose-700 dark:text-rose-300">Data keuangan belum dapat dimuat.</p>
          <p class="max-w-md text-sm text-rose-600 dark:text-rose-400">{{ loadError }}</p>
          <button type="button" class="min-h-11 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white" @click="bestEffortReload">Coba lagi</button>
        </div>
        
        <!-- ========================================= -->
        <!-- TAB 1: LAPORAN -->
        <!-- ========================================= -->
        <div v-else-if="activeTab === 'laporan'" class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
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

          <!-- Mobile cards: laporan -->
          <div class="space-y-3 md:hidden">
            <article v-for="trx in filteredLaporan" :key="trx.id" class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#09090b]">
              <div class="flex justify-between gap-3"><div class="min-w-0"><p class="break-words font-medium">{{ trx.keterangan }}</p><p class="mt-1 text-xs text-slate-500">{{ trx.tanggal }} · {{ trx.kategori }}<template v-if="trx.seksi"> · {{ trx.seksi }}</template></p></div><strong class="shrink-0 text-sm" :class="[trx.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600', trx.status === 'void' && 'line-through opacity-50']">{{ trx.tipe === 'pemasukan' ? '+' : '-' }} {{ formatRupiah(trx.jumlah) }}</strong></div>
              <div class="mt-3 flex justify-end gap-2 border-t pt-2 dark:border-slate-800"><button @click="openTimeline(trx.id)" :data-audit-trigger="`timeline-${trx.id}`" class="min-h-11 px-3 text-sm text-brand-green underline">Riwayat</button><button v-if="canVoidTransaction() && trx.status === 'approved'" @click="openVoidConfirm(trx.id)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" :data-audit-trigger="`void-${trx.id}`" class="min-h-11 min-w-11 text-rose-600 disabled:opacity-50" :aria-label="`Batalkan transaksi ${trx.keterangan}`"><Ban :size="18" class="mx-auto" /></button><span v-else-if="trx.status === 'void'" class="self-center text-xs font-semibold text-rose-600">Dibatalkan</span></div>
            </article>
            <p v-if="!filteredLaporan.length" class="rounded-lg border p-6 text-center text-sm text-slate-500">Belum ada transaksi yang sesuai kriteria filter.</p>
          </div>
          <!-- Compact & Responsive Table Laporan -->
          <div class="hidden rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] overflow-hidden shadow-sm md:block">
            <div class="w-full overflow-x-auto">
              <table class="w-full min-w-[700px] caption-bottom text-sm whitespace-nowrap md:whitespace-normal">
                <thead class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <tr class="transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                    <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 w-[180px]">Tanggal</th>
                    <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 min-w-[200px]">Keterangan</th>
                    <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[140px]">Debit</th>
                    <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[140px]">Kredit</th>
                    <th class="h-10 px-4 text-center align-middle font-medium text-slate-500 w-[120px]">Aksi</th>
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
                    <td class="p-4 text-right align-top text-emerald-600 dark:text-emerald-400 font-medium" :class="trx.status === 'void' && 'line-through opacity-50'">
                      {{ trx.tipe === "pemasukan" ? formatRupiah(trx.jumlah) : "-" }}
                    </td>
                    <td class="p-4 text-right align-top text-rose-600 dark:text-rose-400 font-medium" :class="trx.status === 'void' && 'line-through opacity-50'">
                      {{ trx.tipe === "pengeluaran" ? formatRupiah(trx.jumlah) : "-" }}
                    </td>
                    <td class="p-4 text-center align-top">
                      <button @click="openTimeline(trx.id)" :data-audit-trigger="`timeline-${trx.id}`" class="h-8 px-2 text-xs text-brand-green underline" :aria-label="`Lihat riwayat audit ${trx.keterangan}`">Riwayat</button>
                      <button v-if="canVoidTransaction() && trx.status === 'approved'" @click="openVoidConfirm(trx.id)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" :data-audit-trigger="`void-${trx.id}`" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 h-8 w-8 text-slate-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800" title="Batalkan transaksi" :aria-label="`Batalkan transaksi ${trx.keterangan}`">
                        <Ban :size="16" />
                      </button>
                      <span v-else-if="trx.status === 'void'" class="text-xs font-semibold text-rose-600">Dibatalkan</span>
                    </td>
                  </tr>
                  <tr v-if="filteredLaporan.length === 0">
                    <td colspan="5" class="p-8 text-center text-slate-500">
                      Belum ada transaksi yang sesuai kriteria filter.
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="filteredLaporan.length > 0" class="bg-slate-50/50 dark:bg-slate-900/30 font-medium">
                  <tr>
                    <td colspan="2" class="p-4 text-right">Total Transaksi Filtered:</td>
                    <td class="p-4 text-right text-emerald-600 dark:text-emerald-400">{{ formatRupiah(filteredMasuk) }}</td>
                    <td class="p-4 text-right text-rose-600 dark:text-rose-400">{{ formatRupiah(filteredKeluar) }}</td>
                    <td></td>
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
            <div class="space-y-3 md:hidden"><article v-for="trx in listKetua" :key="trx.id" class="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-[#09090b]"><div class="flex justify-between gap-3"><div><p class="break-words font-medium">{{ trx.keterangan }}</p><p class="mt-1 text-xs text-slate-500">{{ trx.tanggal }} · {{ trx.kategori }} · {{ trx.seksi || '-' }}</p></div><strong class="shrink-0 text-sm">{{ formatRupiah(trx.jumlah) }}</strong></div><div v-if="isKetua || isSuperadmin" class="mt-3 grid grid-cols-2 gap-2"><button @click="openActionConfirm(trx.id, 'approve', trx.status)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" class="min-h-11 rounded-md bg-emerald-600 text-sm text-white disabled:opacity-50">Setujui</button><button @click="openActionConfirm(trx.id, 'reject', trx.status)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" :data-audit-trigger="`reject-${trx.id}`" class="min-h-11 rounded-md border border-rose-200 text-sm text-rose-600 disabled:opacity-50">Tolak</button></div></article><p v-if="!listKetua.length" class="rounded-lg border p-6 text-center text-sm text-slate-500">Antrean bersih.</p></div>
            <div class="hidden rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] overflow-hidden shadow-sm md:block">
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
                          <button @click="openActionConfirm(trx.id, 'approve', trx.status)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-8 w-8 text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Setujui"><CheckCircle :size="16" /></button>
                          <button @click="openActionConfirm(trx.id, 'reject', trx.status)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" :data-audit-trigger="`reject-${trx.id}`" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 h-8 w-8 text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Tolak"><XCircle :size="16" /></button>
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
            <div class="space-y-3 md:hidden"><article v-for="trx in listBendahara" :key="trx.id" class="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-[#09090b]"><div class="flex justify-between gap-3"><div><p class="break-words font-medium">{{ trx.keterangan }}</p><p class="mt-1 text-xs text-slate-500">{{ trx.tanggal }} · {{ trx.kategori }} · {{ trx.seksi || '-' }}</p></div><strong class="shrink-0 text-sm">{{ formatRupiah(trx.jumlah) }}</strong></div><div v-if="isBendahara || isSuperadmin" class="mt-3 grid grid-cols-2 gap-2"><button @click="openActionConfirm(trx.id, 'approve', trx.status)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" class="min-h-11 rounded-md bg-brand-accent text-sm text-white disabled:opacity-50">Cairkan</button><button @click="openActionConfirm(trx.id, 'reject', trx.status)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" :data-audit-trigger="`reject-${trx.id}`" class="min-h-11 rounded-md border border-rose-200 text-sm text-rose-600 disabled:opacity-50">Tolak</button></div></article><p v-if="!listBendahara.length" class="rounded-lg border p-6 text-center text-sm text-slate-500">Antrean bersih.</p></div>
            <div class="hidden rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] overflow-hidden shadow-sm md:block">
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
                          <button @click="openActionConfirm(trx.id, 'approve', trx.status)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" class="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors hover:bg-brand-accent/90 h-8 px-3 bg-brand-accent text-white disabled:cursor-not-allowed disabled:opacity-50 shadow-sm">Cairkan</button>
                          <button @click="openActionConfirm(trx.id, 'reject', trx.status)" :disabled="pendingMutationIds.has(trx.id)" :aria-busy="pendingMutationIds.has(trx.id)" :data-audit-trigger="`reject-${trx.id}`" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-brand-accent/5 hover:text-slate-900 h-8 w-8 text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-brand-accent/10 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700" title="Tolak"><XCircle :size="16" /></button>
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
            <div class="space-y-2 md:hidden"><article v-for="trx in listRejected" :key="trx.id" class="rounded-lg border bg-slate-50/30 p-4 dark:border-slate-800"><div class="flex justify-between gap-3"><div><p class="break-words text-slate-400 line-through">{{ trx.keterangan }}</p><p class="mt-1 text-xs text-slate-500">{{ trx.tanggal }}</p></div><span class="shrink-0 text-sm text-slate-500">{{ formatRupiah(trx.jumlah) }}</span></div></article></div>
            <div class="hidden rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm md:block">
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
                  <Select :model-value="formInput.kategori_id?.toString()" @update:model-value="(val) => { formInput.kategori_id = Number(val); validationInput.kategori_id = ''; }">
                    <SelectTrigger id="input-kategori_id" class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800" :aria-invalid="Boolean(validationInput.kategori_id)" aria-describedby="input-kategori_id-error" :class="validationInput.kategori_id ? 'border-rose-500 ring-1 ring-rose-500' : ''">
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
                  <p v-if="validationInput.kategori_id" id="input-kategori_id-error" class="text-xs text-rose-600">{{ validationInput.kategori_id }}</p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Tanggal Eksekusi</label>
                  <DatePicker v-model="formInput.tanggal" />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Nominal Rupiah</label>
                  <div class="flex h-9 w-full items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] shadow-sm transition-colors focus-within:ring-1 focus-within:ring-brand-green overflow-hidden" :class="validationInput.jumlah ? 'border-rose-500 ring-1 ring-rose-500' : ''">
                    <div class="px-3 h-full flex items-center bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 text-sm text-slate-500">Rp</div>
                    <input id="input-jumlah" :value="formInput.jumlah" type="text" inputmode="numeric" placeholder="0" :aria-invalid="Boolean(validationInput.jumlah)" aria-describedby="input-jumlah-error" @input="formInput.jumlah = formatInputRupiah(($event.target as HTMLInputElement).value); validationInput.jumlah = parseInputRupiah(formInput.jumlah) <= 0 ? 'Nominal harus lebih dari 0.' : '';" class="flex-1 h-full px-3 text-sm font-medium bg-transparent outline-none placeholder:text-slate-500" />
                  </div>
                  <p v-if="validationInput.jumlah" id="input-jumlah-error" class="text-xs text-rose-600">{{ validationInput.jumlah }}</p>
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
                <textarea id="input-keterangan" v-model="formInput.keterangan" rows="3" :aria-invalid="Boolean(validationInput.keterangan)" aria-describedby="input-keterangan-error" placeholder="Contoh: Beli keperluan ATK masjid..." @input="validationInput.keterangan = ''" class="flex w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-green disabled:cursor-not-allowed disabled:opacity-50 resize-none" :class="validationInput.keterangan ? 'border-rose-500 ring-1 ring-rose-500' : ''"></textarea>
                <p v-if="validationInput.keterangan" id="input-keterangan-error" class="text-xs text-rose-600">{{ validationInput.keterangan }}</p>
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
                  <Select :model-value="formProposal.kategori_id?.toString()" @update:model-value="(val) => { formProposal.kategori_id = Number(val); validationProp.kategori_id = ''; }">
                    <SelectTrigger id="proposal-kategori_id" class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800" :aria-invalid="Boolean(validationProp.kategori_id)" aria-describedby="proposal-kategori_id-error" :class="validationProp.kategori_id ? 'border-rose-500 ring-1 ring-rose-500' : ''">
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
                  <p v-if="validationProp.kategori_id" id="proposal-kategori_id-error" class="text-xs text-rose-600">{{ validationProp.kategori_id }}</p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Tanggal Realisasi</label>
                  <DatePicker v-model="formProposal.tanggal" />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Estimasi Nominal</label>
                  <div class="flex h-9 w-full items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] shadow-sm transition-colors focus-within:ring-1 focus-within:ring-brand-green overflow-hidden" :class="validationProp.jumlah ? 'border-rose-500 ring-1 ring-rose-500' : ''">
                    <div class="px-3 h-full flex items-center bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 text-sm text-slate-500">Rp</div>
                    <input id="proposal-jumlah" :value="formProposal.jumlah" type="text" inputmode="numeric" placeholder="0" :aria-invalid="Boolean(validationProp.jumlah)" aria-describedby="proposal-jumlah-error" @input="formProposal.jumlah = formatInputRupiah(($event.target as HTMLInputElement).value); validationProp.jumlah = parseInputRupiah(formProposal.jumlah) <= 0 ? 'Nominal harus lebih dari 0.' : '';" class="flex-1 h-full px-3 text-sm font-medium bg-transparent outline-none placeholder:text-slate-500" />
                  </div>
                  <p v-if="validationProp.jumlah" id="proposal-jumlah-error" class="text-xs text-rose-600">{{ validationProp.jumlah }}</p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium leading-none text-slate-900 dark:text-slate-200">Seksi Pengaju</label>
                  <Select :model-value="formProposal.seksi_id?.toString()" @update:model-value="(val) => { formProposal.seksi_id = Number(val); validationProp.seksi_id = ''; }">
                    <SelectTrigger id="proposal-seksi_id" class="w-full h-9 bg-white dark:bg-[#09090b] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800" :aria-invalid="Boolean(validationProp.seksi_id)" aria-describedby="proposal-seksi_id-error" :class="validationProp.seksi_id ? 'border-rose-500 ring-1 ring-rose-500' : ''">
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
                  <p v-if="validationProp.seksi_id" id="proposal-seksi_id-error" class="text-xs text-rose-600">{{ validationProp.seksi_id }}</p>
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
                <textarea id="proposal-keterangan" v-model="formProposal.keterangan" rows="4" :aria-invalid="Boolean(validationProp.keterangan)" aria-describedby="proposal-keterangan-error" placeholder="Tuliskan secara lengkap rincian barang/jasa yang dibutuhkan..." @input="validationProp.keterangan = ''" class="flex w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-green disabled:cursor-not-allowed disabled:opacity-50 resize-none" :class="validationProp.keterangan ? 'border-rose-500 ring-1 ring-rose-500' : ''"></textarea>
                <p v-if="validationProp.keterangan" id="proposal-keterangan-error" class="text-xs text-rose-600">{{ validationProp.keterangan }}</p>
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
