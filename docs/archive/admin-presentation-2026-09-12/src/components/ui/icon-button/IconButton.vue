<script setup lang="ts">import { Button } from "@/components/ui/button"; defineProps<{ label: string; disabled?: boolean }>();</script>
<template><Button size="icon" variant="ghost" :aria-label="label" :disabled="disabled"><slot /></Button></template>
