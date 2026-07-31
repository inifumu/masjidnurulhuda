<script setup lang="ts">
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import TransactionWorkspace from "@/components/admin/finance/TransactionWorkspace.vue";
import TransactionAuditDialog from "@/components/admin/kas/TransactionAuditDialog.vue";
import { useKas } from "@/composables/admin/useKas";
import { kasService, type TransactionAuditTimeline } from "@/services/admin/kasService";
import { ApiError } from "@/services/httpClient";
import { getErrorMessage } from "../../../../shared/contracts";

const {
  filteredLaporan, categories, selectedMonth, selectedYear, availableYears,
  filterTipe, filterKategori, globalSaldoAwal, globalMasuk, globalKeluar,
  globalSaldoAkhir, pendingMutationIds, formatRupiah, formatWaktuAudit,
  isLoadingData, loadError, hasLoadedData, loadData, handleVoid,
} = useKas();
const dialogOpen = ref(false);
const selectedId = ref<number | null>(null);
const reason = ref("");
const pending = ref(false);
const timeline = ref<TransactionAuditTimeline | null>(null);
const timelineTransactionId = ref<number | null>(null);
const timelineLoading = ref(false);
const timelineError = ref("");
const triggerSelector = ref("");
let timelineRequest = 0;

const reload = () => loadData().catch(() => undefined);
const closeDialog = () => {
  dialogOpen.value = false;
  requestAnimationFrame(() => document.querySelector<HTMLElement>(triggerSelector.value)?.focus());
};
const openVoid = (id: number) => {
  selectedId.value = id;
  reason.value = "";
  triggerSelector.value = `[data-transaction-row="${id}"]`;
  dialogOpen.value = true;
};
const loadTimeline = async (id: number) => {
  const request = ++timelineRequest;
  selectedId.value = id;
  timeline.value = null;
  timelineTransactionId.value = id;
  timelineError.value = "";
  timelineLoading.value = true;
  try {
    const result = await kasService.getTransactionTimeline(id);
    if (request === timelineRequest) {
      timeline.value = result;
    }
  } catch (error) {
    if (request === timelineRequest) timelineError.value = getErrorMessage(error, "Riwayat belum dapat dimuat.");
  } finally {
    if (request === timelineRequest) timelineLoading.value = false;
  }
};
const confirmVoid = async () => {
  const value = reason.value.trim();
  if (!selectedId.value || value.length < 10 || value.length > 500) {
    toast.error("Alasan pembatalan wajib 10–500 karakter.");
    return;
  }
  try {
    pending.value = true;
    await handleVoid(selectedId.value, value);
    dialogOpen.value = false;
    toast.success("Transaksi dibatalkan dan tetap tersimpan di histori.");
    await loadTimeline(selectedId.value);
  } catch (error) {
    toast.error(getErrorMessage(error, "Gagal membatalkan transaksi."));
    if (error instanceof ApiError && error.status === 409) await reload();
  } finally {
    pending.value = false;
  }
};

onMounted(reload);
</script>

<template>
  <section aria-labelledby="transactions-title">
    <header class="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-6">
      <div><p class="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Buku kas</p><h2 id="transactions-title" class="mt-1 text-2xl font-semibold tracking-tight">Transaksi</h2></div>
      <p class="max-w-xl text-sm leading-6 text-muted-foreground md:text-right">Ringkasan periode, transaksi aktif, dan jejak audit dalam satu alur pemeriksaan.</p>
    </header>
    <TransactionWorkspace
      :transactions="filteredLaporan" :categories="categories" :month="selectedMonth" :year="selectedYear"
      :years="availableYears" :flow="filterTipe" :category="filterKategori" :saldo-awal="globalSaldoAwal"
      :total-masuk="globalMasuk" :total-keluar="globalKeluar" :saldo-akhir="globalSaldoAkhir"
      :pending-ids="pendingMutationIds" :loading="isLoadingData" :load-error="loadError"
      :has-loaded="hasLoadedData" :timeline="timeline" :timeline-transaction-id="timelineTransactionId"
      :timeline-loading="timelineLoading" :timeline-error="timelineError" :format-rupiah="formatRupiah"
      :format-waktu-audit="formatWaktuAudit" @reload="reload" @update:month="selectedMonth = $event"
      @update:year="selectedYear = $event" @update:flow="filterTipe = $event"
      @update:category="filterKategori = $event" @select="loadTimeline" @retry-timeline="loadTimeline" @void="openVoid"
    />
    <TransactionAuditDialog :open="dialogOpen" mode="void" :reason="reason" :pending="pending" @update:reason="reason = $event" @close="closeDialog" @confirm="confirmVoid" />
  </section>
</template>
