<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
    <h3 class="font-semibold text-foreground">{{ props.title }}</h3>
    <p class="max-w-prose text-sm leading-6">{{ props.description }}</p>
  </section>
</template>
