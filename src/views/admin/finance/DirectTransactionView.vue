<script setup lang="ts">
import { onMounted } from "vue";
import DirectCashDesk from "@/components/admin/kas/DirectCashDesk.vue";
import { ErrorState } from "@/components/ui/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useKas } from "@/composables/admin/useKas";

const { isLoadingData, loadError, hasLoadedData, loadData } = useKas();
onMounted(() => loadData().catch(() => undefined));
</script>

<template>
  <section aria-labelledby="direct-transaction-title">
    <header class="mb-4 flex flex-col gap-1 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Pencatatan kas</p>
        <h2 id="direct-transaction-title" class="mt-1 text-2xl font-semibold tracking-tight">Catat kas</h2>
      </div>
      <p class="max-w-xl text-sm leading-6 text-muted-foreground xl:text-right">
        Untuk pemasukan atau pengeluaran rutin yang langsung menjadi transaksi disetujui, tanpa alur proposal.
      </p>
    </header>

    <div
      v-if="isLoadingData && !hasLoadedData"
      role="status"
      aria-label="Memuat formulir transaksi"
      class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div class="space-y-5 border-t pt-5">
        <Skeleton class="h-20 w-full" />
        <Skeleton class="h-11 w-full" />
        <Skeleton class="h-44 w-full" />
      </div>
      <Skeleton class="hidden h-64 w-full xl:block" />
    </div>
    <ErrorState
      v-else-if="loadError && !hasLoadedData"
      title="Formulir belum dapat dimuat"
      :description="loadError"
      @retry="loadData"
    />
    <DirectCashDesk v-else />
  </section>
</template>
