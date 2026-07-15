<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { MenuIcon, PanelLeftIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from './utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { isMobile, open, openMobile, toggleSidebar } = useSidebar()
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon-sm"
    aria-controls="admin-sidebar-navigation"
    :aria-expanded="isMobile ? openMobile : open"
    :class="cn('', props.class)"
    @click="toggleSidebar"
  >
    <MenuIcon v-if="isMobile" />
    <PanelLeftIcon v-else class="cn-rtl-flip" />
    <span class="sr-only">Buka atau ciutkan navigasi</span>
  </Button>
</template>
