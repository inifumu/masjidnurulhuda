<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useKas } from '@/composables/admin/useKas';
import { useAuthStore } from '@/stores/authStore';
import { kasService, type KasTransaction, type TransactionAuditTimeline } from '@/services/admin/kasService';
import { canVoid } from '@/utils/permissions';
const props = defineProps<{ mode: 'transactions' | 'proposals' | 'approvals' | 'audit' }>();
const auth = useAuthStore();
const kas = useKas();
const { selectedMonth, selectedYear, filterTipe, filterKategori, categories, transactions, isLoadingData, loadError, pendingMutationIds } = kas;
const queue = ref<KasTransaction[]>([]); const queueLoading = ref(false); const queueError = ref('');
const search = ref(''); const error = ref(''); const notice = ref('');
const selected = ref<KasTransaction | null>(null); const timeline = ref<TransactionAuditTimeline | null>(null);
const timelineLoading = ref(false); const timelineError = ref(''); let sequence = 0;
const action = ref<{ item: KasTransaction; kind: 'approve' | 'reject' | 'void' } | null>(null);
const reason = ref('');
const confirmation = ref<HTMLFormElement>();
const detailSection = ref<HTMLElement>();
const statusLabels: Record<string, string> = { approved: 'Disetujui', void: 'Dibatalkan', rejected: 'Ditolak', pending_ketua: 'Menunggu ketua', pending_bendahara: 'Menunggu bendahara' };
const loading = computed(() => props.mode === 'approvals' ? queueLoading.value : isLoadingData.value);
const dataError = computed(() => props.mode === 'approvals' ? queueError.value : loadError.value);
const rows = computed(() => {
  const source = props.mode === 'approvals' ? queue.value : transactions.value;
  return source.filter(item => {
    const matchesMode = props.mode === 'approvals' || (props.mode === 'proposals' ? !['approved', 'void'].includes(item.status) : ['approved', 'void'].includes(item.status));
    return matchesMode && (item.keperluan + ' ' + item.keterangan + ' ' + item.id).toLowerCase().includes(search.value.toLowerCase());
  });
});
function canDecide(item: KasTransaction) {
  const role = auth.user?.role;
  return (item.status === 'pending_ketua' && (role === 'ketua' || role === 'superadmin')) || (item.status === 'pending_bendahara' && (role === 'bendahara' || role === 'superadmin'));
}
async function reload() {
  if (props.mode !== 'approvals') { await kas.loadData().catch(() => undefined); return; }
  queueLoading.value = true; queueError.value = '';
  try { queue.value = await kasService.getPendingTransactions(); }
  catch (e) { queueError.value = e instanceof Error ? e.message : 'Antrean belum dapat dimuat.'; }
  finally { queueLoading.value = false; }
}
async function detail(item: KasTransaction) {
  const request = ++sequence;
  selected.value = item; timeline.value = null; timelineError.value = ''; timelineLoading.value = true;
  await nextTick(); detailSection.value?.focus();
  try { const result = await kasService.getTransactionTimeline(item.id); if (request === sequence) timeline.value = result; }
  catch (e) { if (request === sequence) timelineError.value = e instanceof Error ? e.message : 'Riwayat gagal dimuat.'; }
  finally { if (request === sequence) timelineLoading.value = false; }
}
async function choose(item: KasTransaction, kind: 'approve' | 'reject' | 'void') {
  action.value = { item, kind }; reason.value = ''; error.value = ''; notice.value = '';
  await nextTick(); confirmation.value?.focus();
}
async function mutate() {
  const intent = action.value;
  if (!intent || pendingMutationIds.value.has(intent.item.id)) return;
  if (intent.kind !== 'approve' && (reason.value.trim().length < 10 || reason.value.trim().length > 500)) { error.value = 'Alasan wajib diisi 10–500 karakter.'; return; }
  error.value = ''; notice.value = '';
  try {
    if (intent.kind === 'void') await kas.handleVoid(intent.item.id, reason.value.trim());
    else await kas.handleAction(intent.item.id, intent.kind, reason.value.trim());
    notice.value = 'Perubahan berhasil disimpan.'; action.value = null;
    selected.value = null; sequence++; await reload();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Perubahan gagal.';
    await reload();
  }
}
watch([selectedMonth, selectedYear, filterTipe, filterKategori], () => { selected.value = null; sequence++; action.value = null; });
onMounted(() => { if (props.mode === 'approvals') void reload(); });
</script>
<template>
  <p v-if="mode === 'approvals'">Antrean seluruh periode. Aksi tersedia sesuai tahap persetujuan dan peran Anda.</p>
  <fieldset v-else><legend>Periode dan filter</legend>
    <p><label>Bulan <select v-model="selectedMonth"><option v-for="month in 12" :key="month" :value="month">{{ month }}</option></select></label> <label>Tahun <input v-model.number="selectedYear" type="number" min="2000" max="2100"></label></p>
    <p><label>Arus kas <select v-model="filterTipe"><option value="semua">Semua</option><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option></select></label></p>
    <p><label>Kategori <select v-model="filterKategori"><option value="semua">Semua</option><option v-for="item in categories" :key="item.id" :value="item.id">{{ item.nama_kategori }}</option></select></label></p>
  </fieldset>
  <p><label>Cari transaksi <input v-model="search" type="search"></label></p>
  <button :disabled="loading" @click="reload">Muat ulang</button>
  <p v-if="loading" role="status">Memuat transaksi…</p>
  <p v-if="dataError" role="alert">{{ dataError }}</p>
  <p v-if="notice" role="status">{{ notice }}</p><p v-if="error" role="alert">{{ error }}</p>
  <form v-if="action" ref="confirmation" tabindex="-1" @submit.prevent="mutate">
    <fieldset :disabled="pendingMutationIds.has(action.item.id)"><legend>Konfirmasi {{ action.kind === 'approve' ? 'persetujuan' : action.kind === 'reject' ? 'penolakan' : 'pembatalan' }}</legend>
      <p>#{{ action.item.id }} — {{ action.item.keperluan }} — {{ kas.formatRupiah(action.item.jumlah) }}</p>
      <p v-if="action.kind === 'approve'">{{ action.item.status === 'pending_ketua' ? 'Proposal diteruskan kepada bendahara.' : 'Dana dicairkan dan transaksi masuk laporan kas.' }}</p>
      <p v-if="action.kind === 'void'">Transaksi tetap tersimpan dalam audit dan tidak dihitung dalam saldo aktif.</p>
      <p v-if="action.kind !== 'approve'"><label>Alasan (10–500 karakter)<br><textarea v-model="reason" cols="25" rows="3" minlength="10" maxlength="500" required /></label></p>
      <button type="submit">Ya, {{ action.kind === 'approve' ? 'setujui' : action.kind === 'reject' ? 'tolak' : 'batalkan transaksi' }}</button> <button type="button" @click="action = null">Batal</button>
    </fieldset>
  </form>
  <section v-if="selected" ref="detailSection" tabindex="-1" aria-label="Detail transaksi">
    <h2>Detail #{{ selected.id }} — {{ selected.keperluan }}</h2>
    <p>{{ selected.keterangan || 'Tidak ada keterangan tambahan.' }}</p>
    <dl><dt>Seksi</dt><dd>{{ selected.seksi || 'Tidak ada' }}</dd><dt>Alasan pembatalan</dt><dd>{{ selected.void_reason || 'Tidak ada' }}</dd></dl>
    <h3>Riwayat perubahan</h3>
    <p v-if="timelineLoading" role="status">Memuat riwayat…</p>
    <p v-else-if="timelineError" role="alert">{{ timelineError }} <button @click="detail(selected)">Coba lagi</button></p>
    <p v-else-if="!timeline?.history_available">Riwayat audit belum tersedia untuk transaksi ini.</p>
    <ol v-else><li v-for="event in timeline.events" :key="event.id">{{ event.created_at }} UTC — {{ event.actor_name || event.actor_id }} — {{ event.event_type }}: {{ event.from_status || 'Awal' }} → {{ event.to_status }}<p v-if="event.reason">{{ event.reason }}</p></li></ol>
    <button @click="selected = null; sequence++">Tutup detail</button>
  </section>
  <template v-if="!loading && !dataError">
    <p v-if="!rows.length">Tidak ada transaksi yang sesuai.</p>
    <ul v-else aria-label="Daftar transaksi"><li v-for="item in rows" :key="item.id">
      <h2>#{{ item.id }} — {{ item.keperluan || item.keterangan }}</h2>
      <dl><dt>Tanggal</dt><dd>{{ item.tanggal }}</dd><dt>Kategori</dt><dd>{{ item.kategori }}</dd><dt>Arus kas</dt><dd>{{ item.tipe }}</dd><dt>Jumlah</dt><dd>{{ kas.formatRupiah(item.jumlah) }}</dd><dt>Status</dt><dd>{{ statusLabels[item.status] }}</dd></dl>
      <button @click="detail(item)">Detail dan audit #{{ item.id }}</button>
      <template v-if="mode === 'approvals' && canDecide(item)">
        <button :disabled="pendingMutationIds.has(item.id)" @click="choose(item, 'approve')">Setujui #{{ item.id }}</button>
        <button :disabled="pendingMutationIds.has(item.id)" @click="choose(item, 'reject')">Tolak #{{ item.id }}</button>
      </template>
      <button v-if="item.status === 'approved' && canVoid(auth.user?.role)" :disabled="pendingMutationIds.has(item.id)" @click="choose(item, 'void')">Batalkan transaksi #{{ item.id }}</button>
    </li></ul>
  </template>
</template>
