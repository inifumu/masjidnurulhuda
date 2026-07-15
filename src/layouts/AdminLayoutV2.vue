<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronRight, Moon, Sun } from "lucide-vue-next";
import { useAuthStore } from "../stores/authStore";
import { useTheme } from "../composables/admin/useTheme";
import AdminSidebar from "@/components/admin/shell/AdminSidebar.vue";
import { IconButton } from "@/components/ui/icon-button";
import { ErrorState } from "@/components/ui/data-state";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { isDark, toggleTheme } = useTheme();
const isLoggingOut = ref(false);

const routeLabels: Record<string, { group?: string; title: string }> = {
  "/admin/dashboard": { title: "Ringkasan" },
  "/admin/finance": { group: "Keuangan", title: "Keuangan" },
  "/admin/media": { group: "Media & publikasi", title: "Pustaka media" },
  "/admin/galeri-dokumentasi": { group: "Media & publikasi", title: "Galeri & dokumentasi" },
  "/admin/pengaturan": { group: "Sistem", title: "Pengaturan" },
};
const currentRouteLabel = computed(() => routeLabels[route.path] ?? { title: "Admin" });

const handleLogout = async () => {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  try {
    await authStore.logout();
    await router.push("/admin/login");
  } finally {
    isLoggingOut.value = false;
  }
};
</script>

<template>
  <SidebarProvider>
    <div v-if="authStore.authStatus === 'error'" class="fixed inset-0 z-[200] grid place-items-center bg-background p-4" role="alert">
      <div class="w-full max-w-lg"><ErrorState title="Sesi belum dapat diverifikasi" description="Koneksi ke server sedang bermasalah. Sesi Anda dipertahankan dan dapat diperiksa kembali tanpa diarahkan ke login." @retry="authStore.retryAuth()" /></div>
    </div>

    <AdminSidebar :is-logging-out="isLoggingOut" @logout="handleLogout" />

    <SidebarInset class="h-svh min-w-0 overflow-hidden">
      <header class="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b bg-card pl-3 pr-3 md:pl-2 md:pr-4">
        <div class="flex min-w-0 items-center gap-2 md:gap-2.5">
          <SidebarTrigger class="size-11! [&_svg]:!size-5 md:size-8!" aria-label="Buka atau ciutkan navigasi" />
          <span class="mr-1.5 hidden h-4 w-px shrink-0 bg-border md:block" aria-hidden="true" />
          <div class="flex min-w-0 items-center gap-1 text-sm">
            <span v-if="currentRouteLabel.group" class="hidden items-center gap-1 text-muted-foreground sm:flex"><span>{{ currentRouteLabel.group }}</span><ChevronRight class="size-5" aria-hidden="true" /></span>
            <span class="truncate font-semibold text-foreground">{{ currentRouteLabel.title }}</span>
          </div>
        </div>
        <IconButton data-theme-trigger class="size-11! [&_svg]:!size-5 md:size-8!" :label="isDark ? 'Gunakan mode terang' : 'Gunakan mode gelap'" :aria-pressed="isDark" @click="toggleTheme">
          <Sun v-if="isDark" class="size-5" aria-hidden="true" /><Moon v-else class="size-5" aria-hidden="true" />
        </IconButton>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="mx-auto min-h-full max-w-[1400px] p-4 md:p-6 lg:p-8"><router-view /></div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
