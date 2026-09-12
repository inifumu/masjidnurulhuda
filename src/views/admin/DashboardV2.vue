<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { dashboardService, type DashboardSummary } from '@/services/admin/dashboardService';
import { getCurrentWibPeriod } from '../../../shared/contracts';
import { formatRupiah } from '@/utils/currency';
const period = ref(getCurrentWibPeriod()); const summary = ref<DashboardSummary | null>(null); const loading = ref(false); const error = ref('');
async function load() { loading.value = true; error.value = ''; summary.value = null; try { summary.value = await dashboardService.getSummary(period.value); } catch(e) { error.value = e instanceof Error ? e.message : 'Ringkasan gagal dimuat.'; } finally { loading.value = false; } }
onMounted(load);
</script>
<template><section><h1>Dashboard</h1><p>Ringkasan kas berdasarkan periode Asia/Jakarta. Transaksi dibatalkan tidak dihitung sebagai kas aktif.</p>
  <form @submit.prevent="load"><fieldset :disabled="loading"><legend>Periode ringkasan</legend><p><label>Bulan <select v-model="period.month"><option v-for="month in 12" :key="month" :value="month">{{ month }}</option></select></label></p><p><label>Tahun <input v-model.number="period.year" type="number" min="2000" max="2100" required></label></p><button type="submit">Tampilkan ringkasan</button></fieldset></form>
  <p v-if="loading" role="status">Memuat ringkasan…</p><p v-if="error" role="alert">{{ error }} <button @click="load">Coba lagi</button></p>
  <dl v-if="summary"><dt>Saldo awal</dt><dd>{{ formatRupiah(summary.saldoAwal) }}</dd><dt>Pemasukan</dt><dd>{{ formatRupiah(summary.totalPemasukan) }}</dd><dt>Pengeluaran</dt><dd>{{ formatRupiah(summary.totalPengeluaran) }}</dd><dt>Saldo akhir</dt><dd>{{ formatRupiah(summary.saldoAkhir) }}</dd></dl>
  <p><RouterLink to="/admin/finance/transaksi">Lihat transaksi</RouterLink></p>
</section></template>
