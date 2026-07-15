<script setup lang="ts">
import { useAuthStore } from "./stores/authStore";
import { Toaster } from "vue-sonner"; // 🟢 Import Toaster
import { computed } from "vue";
import { useRoute } from "vue-router";

const authStore = useAuthStore();
const route = useRoute();
const skipsAuthBootstrap = computed(
  () => route.matched.some((record) => record.meta.skipAuthBootstrap),
);
// Baris authStore.checkAuth() sudah DIBUANG dari sini agar tidak dobel!
</script>

<template>
  <Toaster position="top-right" richColors />

  <div
    v-if="!skipsAuthBootstrap && (authStore.authStatus === 'idle' || authStore.authStatus === 'loading')"
    class="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0e131f]"
  >
    <img
      src="/logo.png"
      alt="Loading"
      class="h-16 w-auto opacity-50 animate-pulse mb-4"
    />
    <p class="text-[13px] text-slate-500 font-medium animate-pulse">
      Menyiapkan Sistem...
    </p>
  </div>

  <router-view v-else />
</template>
