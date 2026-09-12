<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "./stores/authStore";
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const skip = computed(() => route.matched.some(record => record.meta.skipAuthBootstrap));
watch(() => [auth.authStatus, auth.user?.role, route.fullPath], () => {
  if (!route.meta.requiresAuth) return;
  if (auth.shouldRedirectToLogin) void router.replace('/admin/login');
  else if (auth.authStatus === 'authenticated' && Array.isArray(route.meta.roles) && !route.meta.roles.includes(auth.user?.role)) {
    void router.replace('/admin/dashboard');
  }
});
</script>
<template>
  <p v-if="!skip && (auth.authStatus === 'idle' || auth.authStatus === 'loading')" role="status">Memverifikasi sesi…</p>
  <main v-else-if="!skip && auth.authStatus === 'error'">
    <h1>Sesi belum dapat diverifikasi</h1>
    <p role="alert">Layanan belum dapat dijangkau. Coba kembali untuk melanjutkan.</p>
    <button @click="auth.retryAuth">Coba lagi</button>
    <a href="/">Kembali ke website</a>
  </main>
  <router-view v-else />
</template>
