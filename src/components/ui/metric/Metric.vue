<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";
const props = withDefaults(defineProps<{ label: string; value: string; detail?: string; tone?: "default" | "success" | "destructive"; class?: string }>(), { tone: "default" });
const tones = { default: "border-primary", success: "border-success", destructive: "border-destructive" };
const classes = computed(() => cn("border-t-2 bg-card px-4 py-5", tones[props.tone], props.class));
</script>
<template><article :class="classes"><p class="text-sm text-muted-foreground">{{ label }}</p><p class="font-tabular mt-2 text-2xl font-bold tracking-tight" aria-live="polite">{{ value }}</p><p v-if="detail" class="mt-1 text-xs text-muted-foreground">{{ detail }}</p></article></template>
