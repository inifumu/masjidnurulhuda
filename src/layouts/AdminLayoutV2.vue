<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ChevronDown,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  Settings,
  Sun,
  Wallet,
} from "lucide-vue-next";
import type { AdminRole } from "../../shared/contracts/index";
import { useAuthStore } from "../stores/authStore";
import { useTheme } from "../composables/admin/useTheme";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ErrorState } from "@/components/ui/data-state";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { isDark, toggleTheme } = useTheme();
const isDesktopSidebarOpen = ref(true);
const isMobileSheetOpen = ref(false);
const isLoggingOut = ref(false);

type NavItem = {
  name: string;
  shortName: string;
  to: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  roles: readonly AdminRole[];
};

const allRoles: readonly AdminRole[] = ["superadmin", "ketua", "bendahara", "pengurus"];
const navItems: NavItem[] = [
  { name: "Ringkasan", shortName: "Ringkasan", to: "/admin/dashboard", icon: LayoutDashboard, exact: true, roles: allRoles },
  { name: "Keuangan", shortName: "Keuangan", to: "/admin/finance", icon: Wallet, roles: allRoles },
  { name: "Media", shortName: "Media", to: "/admin/media", icon: FolderOpen, roles: allRoles },
  { name: "Pengaturan", shortName: "Pengaturan", to: "/admin/pengaturan", icon: Settings, roles: ["superadmin", "ketua"] },
];

const visibleNavItems = computed(() => {
  const role = authStore.user?.role;
  return role ? navItems.filter((item) => item.roles.includes(role)) : [];
});

const isActiveRoute = (path: string, exact = false) =>
  exact ? route.path === path || route.path === "/admin" : route.path.startsWith(path);

const currentItem = computed(() => visibleNavItems.value.find((item) => isActiveRoute(item.to, item.exact)));
const pageTitle = computed(() => currentItem.value?.name ?? "Admin");
const userInitials = computed(() => {
  const words = (authStore.user?.name || "Admin").trim().split(/\s+/);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
});
const roleLabel = computed(() => ({ superadmin: "Superadmin", ketua: "Ketua", bendahara: "Bendahara", pengurus: "Pengurus" })[authStore.user?.role ?? "pengurus"]);

watch(() => route.path, () => { isMobileSheetOpen.value = false; });

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
  <div class="flex min-h-screen w-full overflow-hidden bg-background text-foreground">
    <div v-if="authStore.authStatus === 'error'" class="fixed inset-0 z-[200] grid place-items-center bg-background p-4" role="alert">
      <div class="w-full max-w-lg">
        <ErrorState title="Sesi belum dapat diverifikasi" description="Koneksi ke server sedang bermasalah. Sesi Anda dipertahankan dan dapat diperiksa kembali tanpa diarahkan ke login." @retry="authStore.retryAuth()" />
      </div>
    </div>

    <aside :class="['hidden shrink-0 flex-col border-r bg-card transition-[width] duration-200 md:flex', isDesktopSidebarOpen ? 'w-64' : 'w-20']">
      <div class="flex h-16 items-center border-b px-4">
        <div v-if="isDesktopSidebarOpen" class="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="" class="size-9 shrink-0 object-contain" />
          <div class="min-w-0"><p class="truncate text-sm font-semibold">Masjid Nurul Huda</p><p class="text-xs text-muted-foreground">Ruang kerja pengurus</p></div>
        </div>
        <IconButton :label="isDesktopSidebarOpen ? 'Ciutkan navigasi' : 'Perluas navigasi'" class="ml-auto" @click="isDesktopSidebarOpen = !isDesktopSidebarOpen">
          <PanelLeftClose class="size-5 transition-transform" :class="!isDesktopSidebarOpen && 'rotate-180'" aria-hidden="true" />
        </IconButton>
      </div>

      <nav class="flex-1 space-y-1 px-3 py-5" aria-label="Navigasi admin">
        <router-link v-for="item in visibleNavItems" :key="item.to" :to="item.to" :aria-label="!isDesktopSidebarOpen ? item.name : undefined" :title="!isDesktopSidebarOpen ? item.name : undefined" :class="['flex min-h-11 items-center rounded-sm text-sm font-medium transition-colors', isDesktopSidebarOpen ? 'gap-3 px-3' : 'justify-center', isActiveRoute(item.to, item.exact) ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground']">
          <component :is="item.icon" class="size-5 shrink-0" aria-hidden="true" />
          <span v-if="isDesktopSidebarOpen">{{ item.name }}</span>
        </router-link>
      </nav>
      <div v-if="isDesktopSidebarOpen" class="border-t px-4 py-4 text-xs leading-5 text-muted-foreground">Akses menu mengikuti peran akun aktif.</div>
    </aside>

    <Sheet v-model:open="isMobileSheetOpen">
      <SheetContent side="left" class="w-[min(20rem,88vw)] p-0">
        <SheetHeader class="border-b px-5 py-5 text-left">
          <SheetTitle class="flex items-center gap-3"><img src="/logo.png" alt="" class="size-9 object-contain" />Masjid Nurul Huda</SheetTitle>
          <SheetDescription>Ruang kerja pengurus</SheetDescription>
        </SheetHeader>
        <nav class="space-y-1 px-3 py-5" aria-label="Navigasi admin mobile">
          <router-link v-for="item in visibleNavItems" :key="item.to" :to="item.to" :class="['flex min-h-12 items-center gap-3 rounded-sm px-3 text-sm font-medium', isActiveRoute(item.to, item.exact) ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground']">
            <component :is="item.icon" class="size-5" aria-hidden="true" />{{ item.name }}
          </router-link>
        </nav>
      </SheetContent>
    </Sheet>

    <div class="flex h-screen min-w-0 flex-1 flex-col">
      <header class="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 md:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <IconButton label="Buka navigasi" class="md:hidden" @click="isMobileSheetOpen = true"><Menu class="size-5" aria-hidden="true" /></IconButton>
          <div class="min-w-0"><p class="text-xs text-muted-foreground">Admin</p><h1 class="truncate text-base font-semibold tracking-tight">{{ pageTitle }}</h1></div>
        </div>
        <div class="flex items-center gap-2">
          <IconButton :label="isDark ? 'Gunakan mode terang' : 'Gunakan mode gelap'" @click="toggleTheme"><Sun v-if="isDark" class="size-5" aria-hidden="true" /><Moon v-else class="size-5" aria-hidden="true" /></IconButton>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="min-h-11 gap-2 px-2" aria-label="Buka menu akun">
                <Avatar class="size-8"><AvatarFallback class="bg-primary text-xs text-primary-foreground">{{ userInitials }}</AvatarFallback></Avatar>
                <span class="hidden max-w-28 truncate text-sm font-medium sm:block">{{ authStore.user?.name || "Admin" }}</span>
                <ChevronDown class="size-4 text-muted-foreground" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-60">
              <DropdownMenuLabel><p class="truncate text-sm font-semibold">{{ authStore.user?.name || "Administrator" }}</p><p class="mt-1 text-xs font-normal text-muted-foreground">{{ roleLabel }}</p></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" :disabled="isLoggingOut" class="min-h-11" @select="handleLogout"><LogOut class="size-4" aria-hidden="true" />{{ isLoggingOut ? "Mengakhiri sesi..." : "Keluar" }}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto">
        <div class="mx-auto min-h-full max-w-[1400px] p-4 md:p-6 lg:p-8"><router-view /></div>
      </main>
    </div>
  </div>
</template>
