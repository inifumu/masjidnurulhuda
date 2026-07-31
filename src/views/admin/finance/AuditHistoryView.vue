<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useKas } from "@/composables/admin/useKas";
import { ErrorState } from "@/components/ui/data-state";
import StatusIndicator from "@/components/ui/status/StatusIndicator.vue";

const {
  filteredLaporan,
  formatRupiah,
  formatWaktuAudit,
  isLoadingData,
  loadError,
  hasLoadedData,
  loadData,
} = useKas();

const audited = computed(() =>
  filteredLaporan.value
    .filter((item) => item.status === "approved" || item.status === "void")
    .slice()
    .sort((a, b) => b.id - a.id),
);

onMounted(() => loadData().catch(() => undefined));
</script>

<template>
  <section aria-labelledby="audit-history-title">
    <header class="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-6">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Akuntabilitas</p>
        <h2 id="audit-history-title" class="mt-1 text-2xl font-semibold tracking-tight">Riwayat audit</h2>
      </div>
      <p class="max-w-xl text-sm leading-6 text-muted-foreground md:text-right">
        Ringkasan status akhir transaksi. Detail event lengkap tersedia dari aksi “Riwayat transaksi” pada buku kas.
      </p>
    </header>

    <div
      v-if="isLoadingData && !hasLoadedData"
      role="status"
      aria-label="Memuat riwayat audit"
      class="flex min-h-64 items-center justify-center rounded-md border bg-card text-sm text-muted-foreground"
    >
      Memuat riwayat audit…
    </div>
    <ErrorState
      v-else-if="loadError && !hasLoadedData"
      title="Riwayat belum dapat dimuat"
      :description="loadError"
      @retry="loadData"
    />
    <div v-else-if="audited.length" class="divide-y rounded-md border bg-card">
      <article
        v-for="item in audited"
        :key="item.id"
        class="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
      >
        <div class="min-w-0">
          <strong class="block truncate">{{ item.keterangan }}</strong>
          <p class="mt-1 text-xs text-muted-foreground">
            #{{ item.id }} · {{ item.tanggal }} · {{ item.kategori }}
            <template v-if="item.approved_at">
              · Disetujui {{ formatWaktuAudit(item.approved_at) }}
            </template>
          </p>
          <p v-if="item.status === 'void'" class="mt-2 text-sm text-destructive">
            Dibatalkan: {{ item.void_reason || "Alasan tidak tersedia pada data legacy." }}
          </p>
        </div>
        <div class="flex items-center justify-between gap-3 sm:justify-end">
          <strong class="font-tabular">{{ formatRupiah(item.jumlah) }}</strong>
          <StatusIndicator :tone="item.status === 'void' ? 'destructive' : 'success'">
            {{ item.status === "void" ? "Dibatalkan" : "Disetujui" }}
          </StatusIndicator>
        </div>
      </article>
    </div>
    <div v-else class="flex min-h-64 items-center justify-center rounded-md border bg-card text-sm text-muted-foreground">
      Belum ada transaksi approved atau void pada periode ini.
    </div>
  </section>
</template>
