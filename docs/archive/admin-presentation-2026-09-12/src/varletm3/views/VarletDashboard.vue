<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { dashboardService, type DashboardSummary } from '@/services/admin/dashboardService'
import { useAuthStore } from '@/stores/authStore'
import IonIcon from '../components/IonIcon.vue'

const auth = useAuthStore()
const summary = ref<DashboardSummary | null>(null)
const loading = ref(true)
const error = ref('')

const money = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const now = new Date()
    summary.value = await dashboardService.getSummary({ month: now.getMonth() + 1, year: now.getFullYear() })
  } catch (cause: unknown) {
    error.value = cause instanceof Error ? cause.message : 'Ringkasan tidak dapat dimuat'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <var-cell :title="`Halo, ${auth.user?.name ?? 'Admin'}`" description="Ringkasan kas periode berjalan" />
  <var-divider />

  <var-cell v-if="loading" title="Memuat ringkasan kas">
    <template #icon><var-loading type="circle" color="var(--color-primary)" /></template>
  </var-cell>

  <var-result v-else-if="error" type="error" title="Ringkasan gagal dimuat" :description="error">
    <template #footer><var-button type="primary" @click="load">Muat ulang</var-button></template>
  </var-result>

  <template v-else-if="summary">
    <var-paper variant="filled" surface="low" :elevation="0">
      <var-cell title="Saldo akhir" :description="money.format(summary.saldoAkhir)">
        <template #icon><IonIcon name="wallet-outline" :size="28" color="var(--color-primary)" /></template>
      </var-cell>
    </var-paper>

    <var-cell-group>
      <var-cell title="Saldo awal" :description="money.format(summary.saldoAwal)">
        <template #icon><IonIcon name="archive-outline" color="var(--color-primary)" /></template>
      </var-cell>
      <var-cell title="Pemasukan" :description="money.format(summary.totalPemasukan)">
        <template #icon><IonIcon name="arrow-down-circle-outline" color="var(--color-primary)" /></template>
      </var-cell>
      <var-cell title="Pengeluaran" :description="money.format(summary.totalPengeluaran)">
        <template #icon><IonIcon name="arrow-up-circle-outline" color="var(--color-primary)" /></template>
      </var-cell>
    </var-cell-group>

    <var-divider />
    <var-cell title="Aksi utama" description="Pilih alur kerja keuangan yang diperlukan" />
    <var-cell-group>
      <var-cell title="Catat kas" description="Tambah pemasukan atau pengeluaran langsung" ripple @click="$router.push('/varletm3/keuangan/transaksi-langsung')">
        <template #icon><IonIcon name="add-circle-outline" color="var(--color-secondary)" /></template>
        <template #extra><IonIcon name="chevron-forward-outline" /></template>
      </var-cell>
      <var-cell title="Proposal" description="Ajukan kebutuhan seksi" ripple @click="$router.push('/varletm3/keuangan/proposal')">
        <template #icon><IonIcon name="document-text-outline" color="var(--color-primary)" /></template>
        <template #extra><IonIcon name="chevron-forward-outline" /></template>
      </var-cell>
      <var-cell title="Persetujuan" description="Periksa antrean sesuai peran" ripple @click="$router.push('/varletm3/keuangan/persetujuan')">
        <template #icon><IonIcon name="checkmark-done-outline" color="var(--color-primary)" /></template>
        <template #extra><IonIcon name="chevron-forward-outline" /></template>
      </var-cell>
    </var-cell-group>
  </template>
</template>
