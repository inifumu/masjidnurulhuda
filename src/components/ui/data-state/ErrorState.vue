<script setup lang="ts">
import { getCurrentInstance } from "vue"
import { Button } from "@/components/ui/button"

const props = defineProps<{
  title: string
  description: string
}>()
const emit = defineEmits<{
  retry: []
}>()
const hasRetryListener = Boolean(getCurrentInstance()?.vnode.props?.onRetry)
</script>

<template>
  <section role="alert" class="flex flex-col items-center gap-2 py-10 text-center">
    <h3 class="font-semibold text-destructive">{{ props.title }}</h3>
    <p class="max-w-prose text-sm leading-6 text-muted-foreground">{{ props.description }}</p>
    <Button v-if="hasRetryListener" type="button" variant="outline" size="sm" class="mt-3" @click="emit('retry')">
      Coba lagi
    </Button>
  </section>
</template>
