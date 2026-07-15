<script setup lang="ts">
defineProps<{ eyebrow?: string; title: string; description?: string }>();
</script>
<template>
  <header class="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.08em] text-primary">{{ eyebrow }}</p>
      <h1 class="mt-1 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">{{ title }}</h1>
      <p v-if="description" class="reading-measure mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap gap-2"><slot name="actions" /></div>
  </header>
</template>
