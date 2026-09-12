<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  name: string
  size?: number | string
  color?: string
}>()
</script>

<template>
  <var-icon :size="size ?? 24" :color="color">
    <Icon :icon="`ion:${name}`" width="1em" height="1em" aria-hidden="true" />
  </var-icon>
</template>
