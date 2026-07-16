<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronRight, Moon, Sun } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useAuthStore } from "../stores/authStore";
import { useTheme } from "../composables/admin/useTheme";
import AdminSidebar from "@/components/admin/shell/AdminSidebar.vue";
import { IconButton } from "@/components/ui/icon-button";
import { ErrorState } from "@/components/ui/data-state";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { isDark, toggleTheme } = useTheme();
const isLoggingOut = ref(false);
const isStoppingImpersonation = ref(false);

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
const stopImpersonation = async () => {
  if (isStoppingImpersonation.value) return;
  isStoppingImpersonation.value = true;
  try {
    await authStore.stopImpersonation();
    toast.success("Mode samaran dihentikan.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Gagal menghentikan mode samaran.");
  } finally { isStoppingImpersonation.value = false; }
};
</script>

<template>
  <SidebarProvider :top-offset="authStore.user?.impersonation ? '3rem' : '0px'">
    <template #banner>
      <div v-if="authStore.user?.impersonation" data-impersonation-banner data-impersonation-banner-global class="sticky top-0 z-30 hidden h-12 shrink-0 items-center justify-between gap-3 border-b border-warning/30 bg-warning-soft px-4 text-sm text-foreground md:flex" role="status">
        <p class="min-w-0 truncate"><strong>Mode samaran: {{ ({ ketua: 'Ketua', bendahara: 'Bendahara', pengurus: 'Pengurus', superadmin: 'Superadmin' })[authStore.user.impersonation.role] }}</strong> — oleh {{ authStore.user.impersonation.actor_name }} (Superadmin).</p>
        <button class="h-8 shrink-0 rounded-sm border border-warning/40 px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :disabled="isStoppingImpersonation" @click="stopImpersonation">{{ isStoppingImpersonation ? "Menghentikan..." : "Keluar samaran" }}</button>
      </div>
    </template>
    <Dialog :open="authStore.authStatus === 'error'">
      <DialogContent :show-close-button="false" class="max-w-lg" @escape-key-down="$event.preventDefault()" @pointer-down-outside="$event.preventDefault()" @interact-outside="$event.preventDefault()">
        <DialogHeader class="sr-only"><DialogTitle>Sesi belum dapat diverifikasi</DialogTitle><DialogDescription>Coba periksa kembali sesi admin.</DialogDescription></DialogHeader>
        <ErrorState title="Sesi belum dapat diverifikasi" description="Koneksi ke server sedang bermasalah. Sesi Anda dipertahankan dan dapat diperiksa kembali tanpa diarahkan ke login." @retry="authStore.retryAuth()" />
      </DialogContent>
    </Dialog>

    <AdminSidebar :is-logging-out="isLoggingOut" @logout="handleLogout" />

    <SidebarInset class="h-full min-w-0 overflow-hidden">
      <div v-if="authStore.user?.impersonation" data-impersonation-banner class="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-warning/30 bg-warning-soft px-3 text-sm text-foreground md:hidden" role="status">
        <p class="min-w-0 text-xs leading-tight sm:text-sm"><strong>Mode samaran: {{ ({ ketua: 'Ketua', bendahara: 'Bendahara', pengurus: 'Pengurus', superadmin: 'Superadmin' })[authStore.user.impersonation.role] }}</strong><span class="block sm:inline"> — oleh {{ authStore.user.impersonation.actor_name }} (Superadmin).</span></p>
        <button class="h-11 shrink-0 rounded-sm border border-warning/40 px-3 font-semibold md:h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :disabled="isStoppingImpersonation" @click="stopImpersonation">{{ isStoppingImpersonation ? "Menghentikan..." : "Keluar samaran" }}</button>
      </div>
      <header class="sticky top-0 z-20 flex min-h-16 shrink-0 items-center justify-between gap-2 border-b bg-card pl-3 pr-3 md:pl-2 md:pr-4">
        <div class="flex min-w-0 items-center gap-2 md:gap-2.5">
          <SidebarTrigger class="size-11! [&_svg]:!size-5 md:size-8!" aria-label="Buka atau ciutkan navigasi" />
          <span class="mr-1.5 hidden h-4 w-px shrink-0 bg-border md:block" aria-hidden="true" />
          <div class="flex min-w-0 items-center gap-1 text-sm">
            <span v-if="currentRouteLabel.group" class="hidden items-center gap-1 text-muted-foreground sm:flex"><span>{{ currentRouteLabel.group }}</span><ChevronRight class="size-5" aria-hidden="true" /></span>
            <span class="truncate font-semibold text-foreground">{{ currentRouteLabel.title }}</span>
          </div>
        </div>
        <IconButton data-theme-trigger class="size-11! rounded-md [&_svg]:!size-5 md:size-8!" :label="isDark ? 'Gunakan mode terang' : 'Gunakan mode gelap'" :aria-pressed="isDark" @click="toggleTheme">
          <Sun v-if="isDark" class="size-5" aria-hidden="true" /><Moon v-else class="size-5" aria-hidden="true" />
        </IconButton>
      </header>
      <div data-slot="admin-content-scroll" class="min-h-0 flex-1 overflow-y-auto">
        <div class="mx-auto min-h-full max-w-[1400px] p-4 md:p-6 lg:p-8"><router-view /></div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
