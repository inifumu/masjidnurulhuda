<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Ban, Filter, Search, X } from "lucide-vue-next";
import type { KasCategory, KasTransaction, TransactionAuditTimeline } from "@/services/admin/kasService";
import type { KasFilterTipe } from "@/composables/admin/kas/useKasState";
import { canVoid } from "@/utils/permissions";
import { useAuthStore } from "@/stores/authStore";
import { getCurrentWibPeriod } from "../../../../shared/contracts/index.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Metric from "@/components/ui/metric/Metric.vue";
import StatusIndicator from "@/components/ui/status/StatusIndicator.vue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const props = withDefaults(defineProps<{
  transactions: KasTransaction[];
  categories: KasCategory[];
  month: number;
  year: number;
  years: number[];
  flow: KasFilterTipe;
  category: number | "semua";
  saldoAwal: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  pendingIds: Set<number>;
  loading: boolean;
  timeline?: TransactionAuditTimeline | null;
  timelineTransactionId?: number | null;
  timelineLoading?: boolean;
  timelineError?: string;
  formatRupiah: (value: number) => string;
  formatWaktuAudit: (value?: string | null) => string;
}>(), {
  timeline: null,
  timelineTransactionId: null,
  timelineLoading: false,
  timelineError: "",
});

const emit = defineEmits<{
  "update:month": [value: number];
  "update:year": [value: number];
  "update:flow": [value: KasFilterTipe];
  "update:category": [value: number | "semua"];
  select: [id: number];
  retryTimeline: [id: number];
  void: [id: number];
}>();

const authStore = useAuthStore();
const search = ref("");
const status = ref<"semua" | "approved" | "void">("semua");
const filterOpen = ref(false);
const selectedId = ref<number | null>(null);
const detailOpen = ref(false);
const detailPanel = ref<HTMLElement | null>(null);
const selectedTrigger = ref<HTMLElement | null>(null);
const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const currentPeriod = getCurrentWibPeriod();
const currentMonth = currentPeriod.month;
const currentYear = currentPeriod.year;
const periodLabel = computed(() => `${months[props.month - 1]} ${props.year}`);
const appliedFilters = computed(() => [
  status.value !== "semua" ? { key: "status", label: status.value === "approved" ? "Disetujui" : "Dibatalkan" } : null,
  props.category !== "semua" ? { key: "category", label: props.categories.find((item) => item.id === props.category)?.nama_kategori ?? "Kategori" } : null,
].filter((item): item is { key: string; label: string } => Boolean(item)));
const visibleTransactions = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("id-ID");
  return props.transactions.filter((transaction) => {
    if (transaction.status !== "approved" && transaction.status !== "void") return false;
    if (status.value !== "semua" && transaction.status !== status.value) return false;
    if (props.flow !== "semua" && transaction.tipe !== props.flow) return false;
    if (props.category !== "semua" && transaction.kategori_id !== props.category) return false;
    return !query || [transaction.keterangan, transaction.kategori, transaction.seksi].filter(Boolean).join(" ").toLocaleLowerCase("id-ID").includes(query);
  });
});
const selectedTransaction = computed(() => visibleTransactions.value.find((item) => item.id === selectedId.value) ?? visibleTransactions.value[0] ?? null);
const visibleTimeline = computed(() => props.timelineTransactionId === selectedTransaction.value?.id ? props.timeline : null);
const filteredMasuk = computed(() => visibleTransactions.value.filter((item) => item.status === "approved" && item.tipe === "pemasukan").reduce((sum, item) => sum + item.jumlah, 0));
const filteredKeluar = computed(() => visibleTransactions.value.filter((item) => item.status === "approved" && item.tipe === "pengeluaran").reduce((sum, item) => sum + item.jumlah, 0));
const timelineLabels: Record<string, string> = { created: "Transaksi langsung dibuat", submitted: "Proposal diajukan", approved_ketua: "Disetujui Ketua", approved_bendahara: "Dicairkan Bendahara", rejected: "Proposal ditolak", voided: "Transaksi dibatalkan" };

const auditLabel = (transaction: KasTransaction) => transaction.approved_at ? `${transaction.tipe === "pengeluaran" ? "Cair" : "Masuk"}: ${props.formatWaktuAudit(transaction.approved_at)}` : "Kas langsung";
const selectTransaction = async (transaction: KasTransaction, event: Event) => {
  selectedId.value = transaction.id;
  selectedTrigger.value = event.currentTarget as HTMLElement;
  detailOpen.value = window.innerWidth < 1024;
  await nextTick();
  if (detailOpen.value) detailPanel.value?.focus();
};
const closeDetail = async () => { detailOpen.value = false; await nextTick(); selectedTrigger.value?.focus(); };
const clearApplied = (key: string) => { if (key === "status") status.value = "semua"; else emit("update:category", "semua"); };
const resetFilters = () => {
  search.value = "";
  status.value = "semua";
  emit("update:flow", "semua");
  emit("update:category", "semua");
  emit("update:month", currentMonth);
  emit("update:year", currentYear);
};
const handleDetailKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Tab" || !detailOpen.value || window.innerWidth >= 1024) return;
  const focusable = detailPanel.value?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
  if (!focusable?.length) return;
  const first = focusable[0]; const last = focusable[focusable.length - 1]; const active = document.activeElement;
  if (event.shiftKey && (active === detailPanel.value || active === first)) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (active === detailPanel.value || active === last)) { event.preventDefault(); first.focus(); }
};
const handleDocumentKeydown = (event: KeyboardEvent) => { if (event.key === "Escape" && detailOpen.value) void closeDetail(); else handleDetailKeydown(event); };
watch(selectedTransaction, (transaction, previous) => {
  if (transaction && transaction.id !== previous?.id) {
    selectedId.value = transaction.id;
    emit("select", transaction.id);
  }
}, { immediate: true });
onMounted(() => document.addEventListener("keydown", handleDocumentKeydown));
onUnmounted(() => document.removeEventListener("keydown", handleDocumentKeydown));
</script>

<template>
  <section class="space-y-3" aria-labelledby="transaction-ledger-title">
    <div class="grid overflow-hidden border-y bg-card sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Saldo awal" :value="formatRupiah(saldoAwal)" :detail="periodLabel" class="border-b sm:border-r lg:border-b-0" />
      <Metric label="Pemasukan periode" :value="`+ ${formatRupiah(totalMasuk)}`" :detail="periodLabel" tone="success" class="border-b lg:border-b-0 lg:border-r" />
      <Metric label="Pengeluaran periode" :value="`− ${formatRupiah(totalKeluar)}`" :detail="periodLabel" tone="destructive" class="border-b sm:border-r sm:border-b-0" />
      <Metric label="Saldo akhir" :value="formatRupiah(saldoAkhir)" :detail="periodLabel" />
    </div>

    <div class="rounded-lg border bg-card p-3 shadow-xs sm:p-4">
      <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label class="relative block"><span class="sr-only">Cari uraian, kategori, atau seksi</span><Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input v-model="search" class="pl-9" placeholder="Cari uraian, kategori, atau seksi…" /></label>
        <Button variant="outline" aria-label="Filter lanjutan" :aria-expanded="filterOpen" aria-controls="transaction-filter-sheet" @click="filterOpen = true"><Filter /><span class="hidden sm:inline">Filter lanjutan</span><span v-if="appliedFilters.length">· {{ appliedFilters.length }}</span></Button>
      </div>
      <div class="mt-3 flex gap-1 rounded-md border bg-muted/30 p-1" aria-label="Filter cepat jenis arus">
        <Button v-for="item in [{ value: 'semua', label: 'Semua' }, { value: 'pemasukan', label: 'Pemasukan' }, { value: 'pengeluaran', label: 'Pengeluaran' }]" :key="item.value" size="sm" class="flex-1" :variant="flow === item.value ? 'secondary' : 'ghost'" :aria-pressed="flow === item.value" :disabled="loading" @click="emit('update:flow', item.value as KasFilterTipe)">{{ item.label }}</Button>
      </div>
      <div v-if="appliedFilters.length" class="mt-3 flex items-center gap-2 overflow-x-auto" aria-label="Filter aktif"><span class="shrink-0 text-xs text-muted-foreground">Filter aktif</span><Button v-for="item in appliedFilters" :key="item.key" size="sm" variant="outline" class="shrink-0 rounded-full" @click="clearApplied(item.key)">{{ item.label }} <X /></Button><Button size="sm" variant="ghost" class="shrink-0" @click="resetFilters">Hapus semua</Button></div>
      <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t pt-3 text-xs text-muted-foreground"><span class="mr-auto"><strong class="text-foreground">{{ visibleTransactions.length }} transaksi</strong> dalam hasil saat ini</span><span>Masuk hasil <strong class="font-tabular text-success">{{ formatRupiah(filteredMasuk) }}</strong></span><span>Keluar hasil <strong class="font-tabular text-destructive">{{ formatRupiah(filteredKeluar) }}</strong></span><span v-if="loading" role="status">Memperbarui…</span></div>
    </div>

    <Sheet :open="filterOpen" @update:open="filterOpen = $event">
      <SheetContent id="transaction-filter-sheet" side="right" class="w-full sm:max-w-md">
        <SheetHeader><SheetTitle>Filter lanjutan</SheetTitle><SheetDescription>Atur periode, status, dan kategori. Jenis arus tersedia sebagai filter cepat.</SheetDescription></SheetHeader>
        <div class="grid gap-5 px-4 py-5">
          <div class="grid grid-cols-2 gap-3"><div class="space-y-1.5"><label class="text-sm font-medium">Bulan</label><Select :model-value="String(month)" @update:model-value="emit('update:month', Number($event))"><SelectTrigger aria-label="Filter bulan" :disabled="loading"><SelectValue /></SelectTrigger><SelectContent position="popper" align="start" class="w-[var(--reka-select-trigger-width)]"><SelectItem v-for="(name,index) in months" :key="name" :value="String(index+1)">{{ name }}</SelectItem></SelectContent></Select></div><div class="space-y-1.5"><label class="text-sm font-medium">Tahun</label><Select :model-value="String(year)" @update:model-value="emit('update:year', Number($event))"><SelectTrigger aria-label="Filter tahun" :disabled="loading"><SelectValue /></SelectTrigger><SelectContent position="popper" align="start" class="w-[var(--reka-select-trigger-width)]"><SelectItem v-for="item in years" :key="item" :value="String(item)">{{ item }}</SelectItem></SelectContent></Select></div></div>
          <div class="space-y-1.5"><label class="text-sm font-medium">Status</label><Select v-model="status"><SelectTrigger aria-label="Filter status"><SelectValue /></SelectTrigger><SelectContent position="popper" align="start" class="w-[var(--reka-select-trigger-width)]"><SelectItem value="semua">Semua status</SelectItem><SelectItem value="approved">Disetujui</SelectItem><SelectItem value="void">Dibatalkan</SelectItem></SelectContent></Select></div>
          <div class="space-y-1.5"><label class="text-sm font-medium">Kategori</label><Select :model-value="String(category)" @update:model-value="emit('update:category', $event === 'semua' ? 'semua' : Number($event))"><SelectTrigger aria-label="Filter kategori" :disabled="loading"><SelectValue /></SelectTrigger><SelectContent position="popper" align="start" class="w-[var(--reka-select-trigger-width)]"><SelectItem value="semua">Semua kategori</SelectItem><SelectItem v-for="item in categories" :key="item.id" :value="String(item.id)">{{ item.nama_kategori }}</SelectItem></SelectContent></Select></div>
        </div>
        <SheetFooter><Button variant="outline" @click="resetFilters">Reset</Button><Button @click="filterOpen = false">Tampilkan hasil</Button></SheetFooter>
      </SheetContent>
    </Sheet>

    <div class="relative overflow-hidden rounded-md border bg-card lg:grid lg:min-h-[34rem] lg:grid-cols-[minmax(0,1fr)_420px]">
      <div class="lg:border-r"><div class="hidden h-11 grid-cols-[minmax(0,1fr)_9rem_6rem] items-center gap-3 border-b px-4 text-xs font-medium text-muted-foreground md:grid"><span>Uraian dan audit</span><span class="text-right">Nominal</span><span class="text-right">Status</span></div>
        <div v-if="visibleTransactions.length" class="divide-y"><button v-for="transaction in visibleTransactions" :key="transaction.id" type="button" class="grid min-h-[7rem] w-full grid-cols-[2rem_minmax(0,1fr)] gap-3 px-4 py-3 text-left hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:min-h-[5.5rem] md:grid-cols-[2rem_minmax(0,1fr)_9rem_6rem] md:items-center" :class="selectedTransaction?.id === transaction.id ? 'bg-secondary shadow-[inset_3px_0_var(--primary)]' : ''" :aria-pressed="selectedTransaction?.id === transaction.id" @click="selectTransaction(transaction,$event)"><span class="flex size-8 items-center justify-center rounded-full" :class="transaction.tipe === 'pemasukan' ? 'bg-success-soft text-success' : 'bg-destructive/10 text-destructive'"><ArrowUpRight v-if="transaction.tipe === 'pemasukan'" /><ArrowDownLeft v-else /></span><span class="min-w-0"><strong class="block truncate">{{ transaction.keterangan }}</strong><span class="mt-1 block text-xs text-muted-foreground">{{ transaction.tanggal }} · {{ transaction.kategori }}<template v-if="transaction.seksi"> · {{ transaction.seksi }}</template></span><span class="mt-1 block text-xs text-muted-foreground">{{ auditLabel(transaction) }}</span></span><strong class="font-tabular col-start-2 text-sm md:col-auto md:text-right" :class="transaction.tipe === 'pemasukan' ? 'text-success' : 'text-destructive'">{{ transaction.tipe === 'pemasukan' ? '+' : '−' }} {{ formatRupiah(transaction.jumlah) }}</strong><StatusIndicator class="col-start-2 justify-self-start md:col-auto md:justify-self-end" :tone="transaction.status === 'void' ? 'destructive' : 'success'">{{ transaction.status === 'void' ? 'Dibatalkan' : 'Disetujui' }}</StatusIndicator></button></div>
        <div v-else class="flex min-h-64 flex-col items-center justify-center px-6 text-center"><strong>Tidak ada transaksi</strong><p class="mt-1 text-sm text-muted-foreground">Ubah pencarian atau filter untuk melihat data lain.</p></div>
      </div>
      <div v-if="selectedTransaction" ref="detailPanel" role="dialog" :aria-modal="detailOpen ? 'true' : undefined" aria-labelledby="transaction-ledger-title" class="fixed inset-0 z-50 overflow-y-auto bg-card p-5 outline-none md:max-lg:fixed md:inset-y-0 md:left-auto md:w-[72vw] md:max-w-[36rem] md:border-l md:shadow-xl lg:static lg:z-auto lg:block lg:w-auto lg:p-6 lg:shadow-none" :class="detailOpen ? 'block' : 'hidden lg:block'" tabindex="-1" @keydown="handleDetailKeydown">
        <Button variant="outline" size="icon" class="mb-4 lg:hidden" aria-label="Kembali ke daftar" @click="closeDetail"><ArrowLeft /></Button>
        <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-xs font-semibold tracking-wide text-muted-foreground">TRANSAKSI #{{ selectedTransaction.id }}</p><h2 id="transaction-ledger-title" class="mt-1 text-xl font-semibold tracking-tight">{{ selectedTransaction.keterangan }}</h2><p class="mt-1 text-sm text-muted-foreground">{{ selectedTransaction.tanggal }} · {{ selectedTransaction.kategori }}</p></div><StatusIndicator class="shrink-0" :tone="selectedTransaction.status === 'void' ? 'destructive' : 'success'">{{ selectedTransaction.status === 'void' ? 'Dibatalkan' : 'Disetujui' }}</StatusIndicator></div>
        <p class="font-tabular my-6 text-3xl font-bold tracking-tight" :class="selectedTransaction.tipe === 'pemasukan' ? 'text-success' : 'text-destructive'">{{ selectedTransaction.tipe === 'pemasukan' ? '+' : '−' }} {{ formatRupiah(selectedTransaction.jumlah) }}</p>
        <dl class="grid grid-cols-2 gap-5 text-sm"><div><dt class="text-muted-foreground">Jenis arus</dt><dd class="mt-1 font-medium">{{ selectedTransaction.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran' }}</dd></div><div><dt class="text-muted-foreground">Seksi</dt><dd class="mt-1 font-medium">{{ selectedTransaction.seksi || 'Tanpa seksi' }}</dd></div></dl>
        <div v-if="selectedTransaction.status === 'void'" class="mt-6 border-y border-destructive/20 bg-destructive/5 py-4"><p class="text-sm font-semibold text-destructive">Alasan pembatalan</p><p class="mt-1 text-sm">{{ selectedTransaction.void_reason || 'Alasan tidak tersedia pada data legacy.' }}</p></div>
        <section class="mt-7 border-t pt-5" aria-labelledby="timeline-title"><h3 id="timeline-title" class="font-semibold">Riwayat transaksi</h3><p v-if="timelineLoading || timelineTransactionId !== selectedTransaction.id" role="status" class="mt-3 text-sm text-muted-foreground">Memuat riwayat…</p><p v-else-if="timelineError" role="alert" class="mt-3 border-l-2 border-destructive pl-3 text-sm">{{ timelineError }} <Button variant="link" class="h-auto px-1" @click="emit('retryTimeline', selectedTransaction.id)">Coba lagi</Button></p><p v-else-if="visibleTimeline && !visibleTimeline.history_available" class="mt-3 border-l-2 border-warning pl-3 text-sm">Riwayat sebelum audit trail tidak tersedia.</p><ol v-else-if="visibleTimeline" class="mt-4 border-l pl-5"><li v-for="event in visibleTimeline.events" :key="event.id" class="relative pb-5 last:pb-0"><span class="absolute -left-[25px] top-1 size-2 rounded-full bg-primary" /><p class="font-semibold">{{ timelineLabels[event.event_type] || event.event_type }}</p><p class="text-xs text-muted-foreground">{{ formatWaktuAudit(event.created_at) }} · {{ event.actor_name || `Pengguna #${event.actor_id}` }}</p><p v-if="event.reason" class="mt-1 text-sm">Alasan: {{ event.reason }}</p></li></ol></section>
        <div class="mt-6"><Button v-if="canVoid(authStore.user?.role) && selectedTransaction.status === 'approved'" variant="destructive" :disabled="pendingIds.has(selectedTransaction.id)" :data-audit-trigger="`void-${selectedTransaction.id}`" @click="emit('void',selectedTransaction.id)"><Ban /> Batalkan transaksi</Button></div>
      </div>
    </div>
  </section>
</template>
