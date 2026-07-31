<script setup lang="ts">
import { onMounted } from "vue";
import KasApproval from "@/components/admin/kas/KasApproval.vue";
import { ErrorState } from "@/components/ui/data-state";
import { useKas } from "@/composables/admin/useKas";

const { isLoadingData, loadError, hasLoadedData, loadData } = useKas();
onMounted(() => loadData().catch(() => undefined));
</script>

<template>
  <section aria-labelledby="approvals-title">
    <header class="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between md:gap-6">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Keputusan</p>
        <h2 id="approvals-title" class="mt-1 text-2xl font-semibold tracking-tight">Persetujuan</h2>
      </div>
      <p class="max-w-xl text-sm leading-6 text-muted-foreground md:text-right">
        Tinjau proposal sesuai tahap dan kewenangan role aktif.
      </p>
    </header>

    <div
      v-if="isLoadingData && !hasLoadedData"
      role="status"
      aria-label="Memuat antrean persetujuan"
      class="rounded-md border bg-card p-4 sm:p-6"
    >
      <div class="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
        Memuat antrean persetujuan…
      </div>
    </div>
    <ErrorState
      v-else-if="loadError && !hasLoadedData"
      title="Antrean belum dapat dimuat"
      :description="loadError"
      @retry="loadData"
    />
    <div v-else class="rounded-md border bg-card p-4 sm:p-6">
      <KasApproval />
    </div>
  </section>
</template>
