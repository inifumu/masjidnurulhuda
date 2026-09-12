<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{ tone?: "success" | "warning" | "info" | "destructive"; class?: string }>(), { tone: "info" });
const tones = { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", info: "bg-info-soft text-info", destructive: "bg-destructive/10 text-destructive" };
const classes = computed(() => cn("inline-flex min-h-7 items-center gap-2 rounded-full px-2.5 text-xs font-semibold", tones[props.tone], props.class));
</script>
<template><span role="status" :class="classes"><span class="size-1.5 rounded-full bg-current" aria-hidden="true" /><slot /></span></template>
