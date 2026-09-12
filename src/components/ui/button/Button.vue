<template>
  <component :is="asChild ? 'span' : 'button'" v-bind="$attrs"><slot /></component>
</template>
<script setup lang="ts">defineProps<{ asChild?: boolean; variant?: string }>();</script>
