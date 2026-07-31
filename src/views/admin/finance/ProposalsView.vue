<script setup lang="ts">
import { onMounted } from "vue";
import KasProposal from "@/components/admin/kas/KasProposal.vue";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/data-state";
import { useKas } from "@/composables/admin/useKas";

const { isLoadingData, loadError, hasLoadedData, loadData } = useKas();
onMounted(() => loadData().catch(() => undefined));
</script>

<template>
  <section aria-labelledby="proposals-title">
    <header class="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-6">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Pengajuan</p>
        <h2 id="proposals-title" class="mt-1 text-2xl font-semibold tracking-tight">Proposal saya</h2>
      </div>
      <p class="max-w-xl text-sm leading-6 text-muted-foreground md:text-right">
        Ajukan kebutuhan dana atau laporkan setoran melalui jalur persetujuan.
      </p>
    </header>

    <div
      v-if="isLoadingData && !hasLoadedData"
      role="status"
      aria-label="Memuat formulir proposal"
      class="rounded-md border bg-card p-4 sm:p-6"
    >
      <div class="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
        Memuat formulir proposal…
      </div>
    </div>
    <ErrorState
      v-else-if="loadError && !hasLoadedData"
      title="Formulir belum dapat dimuat"
      :description="loadError"
      @retry="loadData"
    />
    <template v-else>
      <div v-if="loadError && hasLoadedData" role="status" class="mb-4 flex flex-col gap-3 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>Data referensi mungkin sudah berubah karena pembaruan terakhir gagal. Muat ulang sebelum mengajukan proposal.</p>
        <Button type="button" variant="outline" class="min-h-11 shrink-0 xl:h-8 xl:min-h-8" @click="loadData">Muat ulang</Button>
      </div>
      <KasProposal />
    </template>
  </section>
</template>
