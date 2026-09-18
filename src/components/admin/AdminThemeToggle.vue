<script setup lang="ts">
import { computed, onMounted } from "vue"
import { Moon, Sun } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useAdminTheme } from "@/utils/adminTheme"

const { theme, initialize, setTheme } = useAdminTheme()
const dark = computed(() => theme.value === "dark")

onMounted(initialize)

function toggleTheme() {
  setTheme(dark.value ? "light" : "dark")
}
</script>

<template>
  <Button
    data-admin-theme-toggle
    type="button"
    variant="outline"
    size="icon-sm"
    :aria-label="dark ? 'Gunakan mode terang' : 'Gunakan mode gelap'"
    :title="dark ? 'Gunakan mode terang' : 'Gunakan mode gelap'"
    @click="toggleTheme"
  >
    <Sun v-if="dark" aria-hidden="true" />
    <Moon v-else aria-hidden="true" />
  </Button>
</template>
