<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuthStore } from "../stores/authStore";
import { useRouter, useRoute } from "vue-router";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Menu,
  BookOpen,
  PanelLeftClose,
  Moon,
  Sun,
} from "lucide-vue-next";
import { useTheme } from "../composables/admin/useTheme";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isSidebarOpen = ref(true);

// 🟢 Aktifkan state dan fungsi dark mode
const { isDark, toggleTheme } = useTheme();

onMounted(() => {
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false;
  }
});

watch(
  () => route.path, // Pantau jika URL berubah
  () => {
    // Kalau layar < 768px (Mobile/Tablet kecil), tutup sidebar!
    if (window.innerWidth < 768) {
      isSidebarOpen.value = false;
    }
  },
);

const handleLogout = async () => {
  await authStore.logout();
  router.push("/admin/login");
};
</script>

<template>
  <div
    class="h-screen w-full bg-[#fafafa] dark:bg-[#0e131f] flex overflow-hidden font-sans"
  >
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
    ></div>

    <aside
      :class="[
        'fixed md:relative inset-y-0 left-0 z-50 h-full bg-white dark:bg-[#121826] border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 overflow-hidden',
        isSidebarOpen
          ? 'w-64 translate-x-0'
          : 'w-0 -translate-x-full md:translate-x-0 md:border-transparent',
      ]"
    >
      <div class="w-64 h-full flex flex-col">
        <div
          class="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-shrink-0"
        >
          <h1
            class="text-base font-semibold text-brand-green whitespace-nowrap"
          >
            Admin Panel
          </h1>
          <button
            @click="isSidebarOpen = false"
            class="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded transition-colors"
          >
            <PanelLeftClose :size="18" :stroke-width="1.5" />
          </button>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1">
          <router-link
            to="/admin/dashboard"
            class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
            :class="
              $route.path === '/admin/dashboard' || $route.path === '/admin'
                ? 'bg-brand-green/10 text-brand-green'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            "
          >
            <LayoutDashboard :size="18" :stroke-width="1.5" /> Dashboard
          </router-link>
          <router-link
            to="/admin/keuangan"
            class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
            :class="
              $route.path.startsWith('/admin/keuangan')
                ? 'bg-brand-green/10 text-brand-green'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            "
          >
            <Wallet :size="18" :stroke-width="1.5" /> Keuangan Kas
          </router-link>
          <a
            href="#"
            class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
            ><FileText :size="18" :stroke-width="1.5" /> Artikel & Info</a
          >
          <a
            href="#"
            class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
            ><BookOpen :size="18" :stroke-width="1.5" /> Dokumentasi</a
          >
          <router-link
            to="/admin/pengaturan"
            class="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
            :class="
              $route.path.startsWith('/admin/pengaturan')
                ? 'bg-brand-green/10 text-brand-green'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            "
          >
            <Settings :size="18" :stroke-width="1.5" /> Pengaturan
          </router-link>
        </nav>

        <div
          class="p-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0"
        >
          <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
          >
            <LogOut :size="18" :stroke-width="1.5" /> Logout
          </button>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <header
        class="h-14 bg-white/80 dark:bg-[#121826]/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between flex-shrink-0 z-10"
      >
        <div class="flex items-center gap-3">
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="text-slate-500 hover:text-brand-green dark:text-slate-400 dark:hover:text-brand-green transition-colors flex items-center justify-center w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <PanelLeftClose
              v-if="isSidebarOpen"
              :size="20"
              :stroke-width="1.5"
            />
            <Menu v-else :size="20" :stroke-width="1.5" />
          </button>
          <div class="font-medium text-sm text-slate-800 dark:text-slate-300">
            Sistem Manajemen Nurul Huda
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="toggleTheme"
            class="p-1.5 text-slate-500 hover:text-brand-green dark:text-slate-400 dark:hover:text-amber-500 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 active:scale-95 shadow-sm"
            title="Ganti Tema"
          >
            <Moon v-if="!isDark" :size="18" :stroke-width="1.5" />
            <Sun v-else :size="18" :stroke-width="1.5" class="text-amber-500" />
          </button>

          <div
            class="w-7 h-7 rounded-full bg-brand-accent text-white flex items-center justify-center font-semibold text-xs shadow-sm"
          >
            {{ authStore.user?.name?.charAt(0) || "A" }}
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <router-view />
      </main>
    </div>
  </div>
</template>
