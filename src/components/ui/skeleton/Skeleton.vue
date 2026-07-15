<script setup lang="ts">defineProps<{ label?:string }>();</script>
<template><div role="status" :aria-label="label ?? 'Memuat'" class="animate-pulse rounded-sm bg-muted"><span class="sr-only">{{ label ?? "Memuat" }}</span></div></template>
