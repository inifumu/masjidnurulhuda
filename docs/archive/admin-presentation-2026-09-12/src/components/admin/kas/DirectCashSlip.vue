<script setup lang="ts">
import { CheckCircle2, ReceiptText } from "lucide-vue-next";

defineProps<{
  title: string;
  amount: string;
  flow: string;
  flowTone: string;
  category: string;
  date: string;
  section: string;
  description?: string;
}>();
</script>

<template>
  <div data-direct-cash-slip class="flex min-w-0 flex-col bg-transparent">
    <div class="flex min-w-0 items-start justify-between gap-3 border-b border-dashed pb-4">
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Slip pencatatan</p>
        <h3 class="mt-2 break-words text-xl font-semibold leading-snug">{{ title }}</h3>
      </div>
      <span class="inline-flex shrink-0 items-center gap-2 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
        <CheckCircle2 class="size-3.5 text-primary" aria-hidden="true" />
        Siap dicatat
      </span>
    </div>

    <div class="mt-5 min-w-0">
      <small class="text-xs uppercase tracking-[0.12em] text-muted-foreground">Nominal</small>
      <p class="mt-2 break-words text-[2rem] font-semibold tracking-tight tabular-nums">{{ amount }}</p>
    </div>

    <dl class="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 bg-muted/20 p-4">
      <div v-for="item in [{ label: 'Arus', value: flow }, { label: 'Kategori', value: category }, { label: 'Tanggal', value: date }, { label: 'Seksi', value: section }]" :key="item.label" class="min-w-0">
        <dt class="text-xs text-muted-foreground">{{ item.label }}</dt>
        <dd class="mt-1 min-w-0 break-words text-sm font-semibold" :class="item.label === 'Arus' ? flowTone : undefined">{{ item.value }}</dd>
      </div>
    </dl>

    <div v-if="description?.trim()" class="min-w-0 border-b border-dashed py-4">
      <small class="text-xs uppercase tracking-[0.12em] text-muted-foreground">Keterangan tambahan</small>
      <p class="mt-2 break-words text-sm leading-6 text-muted-foreground">{{ description }}</p>
    </div>

    <div class="flex items-start gap-2 py-4 text-sm leading-6 text-muted-foreground">
      <ReceiptText class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <span>Setelah disimpan, transaksi langsung disetujui, masuk laporan periode, dan memiliki jejak audit.</span>
    </div>
    <slot />
  </div>
</template>
