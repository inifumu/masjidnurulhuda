<!--
  Tujuan: Layout admin aktif (V2) untuk route `/admin/*` dengan sidebar responsif, header aksi, dan navigasi role-aware.
  Caller: src/router/index.ts pada parent route `/admin`.
  Dependensi: authStore, useTheme, vue-router, komponen UI shadcn-vue (Button/Avatar/Dropdown).
  Main Functions: render shell admin, sinkronisasi active route/title, toggle sidebar desktop-mobile, logout session.
  Side Effects: memanggil logout authStore dan redirect ke `/admin/login`.
-->
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useAuthStore } from "../stores/authStore";
import { useRouter, useRoute } from "vue-router";
import { useTheme } from "../composables/admin/useTheme";

// Ikon Lucide
import {
  LayoutDashboard,
  Wallet,
  Settings,
  LogOut,
  Menu,
  Images,
  FolderOpen,
  PanelLeftClose,
  Moon,
  Sun,
  ChevronDown,
  X,
} from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { isDark, toggleTheme } = useTheme();

const isDesktopSidebarOpen = ref(true);
const isMobileSheetOpen = ref(false);

watch(
  () => route.path,
  () => {
    isMobileSheetOpen.value = false;
  },
);

const handleLogout = async () => {
  await authStore.logout();
  router.push("/admin/login");
};

const navItems = [
  { name: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, exact: true },
  { name: "Keuangan Kas", to: "/admin/finance", icon: Wallet },
  { name: "Galeri & Dokumentasi", to: "/admin/galeri-dokumentasi", icon: Images },
  { name: "Media Library", to: "/admin/media", icon: FolderOpen },
  { name: "Pengaturan", to: "/admin/pengaturan", icon: Settings },
];

const isActiveRoute = (path: string, exact = false) => {
  if (exact) return route.path === path || route.path === "/admin";
  return route.path.startsWith(path);
};

const userInitials = computed(() => {
  const name = authStore.user?.name || "Admin";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
});

const pageTitle = computed(() => {
  const current = navItems.find((item) => isActiveRoute(item.to, item.exact));
  return current ? current.name : route.name || "Dashboard";
});
</script>

<template>
  <div class="min-h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-950 dark:text-slate-50 flex font-sans overflow-hidden">
    <div v-if="authStore.authStatus === 'error'" class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="alert">
      <div class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-700 dark:bg-slate-950">
        <h1 class="text-lg font-semibold">Sesi belum dapat diverifikasi</h1>
        <p class="mt-2 text-sm text-slate-500">Koneksi ke server sedang bermasalah. Sesi Anda tidak dihapus dan halaman ini tidak akan mengarahkan ke login secara otomatis.</p>
        <button type="button" class="mt-5 min-h-11 rounded-md bg-brand-green px-5 py-2 text-sm font-medium text-white" @click="authStore.retryAuth()">
          Coba lagi
        </button>
      </div>
    </div>
    <!-- Desktop Sidebar -->
    <aside
      :class="[
        'hidden md:flex flex-col bg-white dark:bg-[#09090b] border-r border-slate-200/60 dark:border-slate-800/60 transition-all duration-200 ease-in-out z-20',
        isDesktopSidebarOpen ? 'w-[240px]' : 'w-[64px]'
      ]"
    >
      <!-- Logo Header -->
      <div class="h-14 flex items-center px-3 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0 relative">
        <div 
          class="flex items-center gap-2 overflow-hidden transition-all duration-200"
          :class="isDesktopSidebarOpen ? 'w-full opacity-100' : 'w-8 opacity-0 pointer-events-none'"
        >
          <div class="w-8 h-8 rounded-md bg-transparent flex items-center justify-center shrink-0 relative z-10 overflow-hidden p-0.5">
            <img src="/logo.png" alt="Logo" class="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <span class="font-semibold text-sm tracking-tight whitespace-nowrap">
            Masjid Nurul Huda
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          @click="isDesktopSidebarOpen = !isDesktopSidebarOpen"
          class="absolute z-10 w-8 h-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10 transition-all duration-200"
          :class="isDesktopSidebarOpen ? 'right-2.5' : 'left-1/2 -translate-x-1/2'"
        >
          <PanelLeftClose :size="16" :stroke-width="1.5" :class="!isDesktopSidebarOpen && 'rotate-180'" />
        </Button>
      </div>

      <!-- Navigation -->
      <div class="flex-1 py-3">
        <nav class="space-y-1 px-3">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center h-9 w-full rounded-md text-sm font-medium transition-colors duration-200 group relative"
            :class="[
              isActiveRoute(item.to, item.exact)
                ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10 hover:text-slate-900 dark:hover:text-slate-50'
            ]"
          >
            <div class="w-10 h-full flex items-center justify-center shrink-0 relative z-10">
              <component
                :is="item.icon"
                :size="18"
                :stroke-width="isActiveRoute(item.to, item.exact) ? 2.2 : 1.75"
                class="shrink-0 antialiased"
                style="shape-rendering: geometricPrecision; text-rendering: optimizeLegibility;"
              />
            </div>
            
            <div 
              class="overflow-hidden transition-all duration-200 relative z-10"
              :class="isDesktopSidebarOpen ? 'w-[160px] opacity-100' : 'w-0 opacity-0'"
            >
              <span class="whitespace-nowrap block truncate">
                {{ item.name }}
              </span>
            </div>

            <!-- Tooltip when collapsed -->
            <span
              v-if="!isDesktopSidebarOpen"
              class="absolute left-[60px] top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 text-xs px-2.5 py-1.5 rounded shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap pointer-events-none font-medium border border-slate-700/50 dark:border-slate-300/50"
            >
              {{ item.name }}
            </span>
          </router-link>
        </nav>
      </div>
    </aside>

    <!-- Mobile Drawer Overlay -->
    <transition name="fade">
      <div
        v-if="isMobileSheetOpen"
        @click="isMobileSheetOpen = false"
        class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 md:hidden"
      ></div>
    </transition>

    <!-- Mobile Drawer Panel -->
    <transition name="slide-left">
      <aside
        v-if="isMobileSheetOpen"
        class="fixed inset-y-0 left-0 z-50 w-[260px] bg-white dark:bg-[#09090b] border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col md:hidden shadow-xl"
      >
        <div class="h-14 flex items-center justify-between px-4 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-md bg-transparent flex items-center justify-center shrink-0 overflow-hidden p-0.5">
              <img src="/logo.png" alt="Logo" class="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <span class="font-semibold text-sm tracking-tight">Masjid Nurul Huda</span>
          </div>
          <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-500" @click="isMobileSheetOpen = false">
            <X :size="18" :stroke-width="1.5" />
          </Button>
        </div>
        <div class="flex-1 py-4 overflow-y-auto">
          <nav class="space-y-1 px-3">
            <router-link
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center h-10 w-full rounded-md text-sm font-medium transition-colors"
              :class="[
                isActiveRoute(item.to, item.exact)
                  ? 'bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10 hover:text-slate-900 dark:hover:text-slate-50'
              ]"
            >
              <div class="w-10 h-full flex items-center justify-center shrink-0">
                <component 
                  :is="item.icon" 
                  :size="18" 
                  :stroke-width="isActiveRoute(item.to, item.exact) ? 2.2 : 1.75" 
                  class="antialiased" 
                  style="shape-rendering: geometricPrecision; text-rendering: optimizeLegibility;" 
                />
              </div>
              <span class="whitespace-nowrap">{{ item.name }}</span>
            </router-link>
          </nav>
        </div>
      </aside>
    </transition>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50/50 dark:bg-[#09090b]/50">
      
      <!-- Premium Glass Header -->
      <header class="h-14 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-4 z-10 shrink-0">
        
        <!-- Left: Mobile Toggle & Breadcrumb -->
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" class="md:hidden h-8 w-8 text-slate-500" @click="isMobileSheetOpen = true">
            <Menu :size="18" :stroke-width="1.5" />
          </Button>
          
          <div class="flex items-center text-sm">
            <span class="text-slate-400 dark:text-slate-500">Admin</span>
            <span class="mx-2 text-slate-300 dark:text-slate-700">/</span>
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ pageTitle }}</span>
          </div>
        </div>

        <!-- Right: Actions & User -->
        <div class="flex items-center gap-1.5 md:gap-3">
          <!-- Theme Toggle -->
          <Button variant="ghost" size="icon" @click="toggleTheme" class="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10 relative overflow-hidden">
            <Sun :size="16" :stroke-width="1.5" class="absolute transition-all duration-300" :class="isDark ? 'rotate-0 scale-100 text-amber-500' : '-rotate-90 scale-0'" />
            <Moon :size="16" :stroke-width="1.5" class="absolute transition-all duration-300" :class="isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'" />
          </Button>

          <div class="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

          <!-- User Dropdown -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" class="h-8 p-1 md:pl-1 md:pr-2 rounded-full flex items-center gap-2 hover:bg-brand-accent/5 dark:hover:bg-brand-accent/10 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                <Avatar class="h-6 w-6 border border-slate-200 dark:border-slate-800">
                  <AvatarFallback class="bg-brand-green text-white text-[10px] font-medium">
                    {{ userInitials }}
                  </AvatarFallback>
                </Avatar>
                <span class="hidden md:block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {{ authStore.user?.name?.split(" ")[0] || "Admin" }}
                </span>
                <ChevronDown :size="14" class="hidden md:block text-slate-400" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" class="w-56 mt-1.5 shadow-xl border-slate-200/60 dark:border-slate-800/60 rounded-xl">
              <DropdownMenuLabel class="font-normal p-2.5">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium leading-none">{{ authStore.user?.name || "Administrator" }}</p>
                  <p class="text-xs leading-none text-slate-500 dark:text-slate-400 capitalize">{{ authStore.user?.role || "Administrator" }}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <button @click="handleLogout" class="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                <LogOut :size="14" /> <span class="text-xs font-medium">Keluar</span>
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto">
        <!-- Optional: pattern overlay for premium feel -->
        <!-- <div class="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] pointer-events-none z-0"></div> -->
        
        <div class="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto h-full relative z-10">
          <router-view v-slot="{ Component }">
            <transition name="fade-scale" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* Modern Vue Router Transitions */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.99) translateY(4px);
}

/* Base Overlays */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Panel Mobile */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}
</style>
