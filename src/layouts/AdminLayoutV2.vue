<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore, type AuthRole } from "@/stores/authStore";
const auth = useAuthStore();
const route = useRoute();
const busy = ref(false);
const error = ref("");
const previewRole = ref<Exclude<AuthRole, "superadmin">>("pengurus");
const settings = computed(() => ["superadmin", "ketua"].includes(auth.user?.role ?? ""));
async function logout() {
  if (busy.value) return;
  busy.value = true;
  try { await auth.logout(); window.location.assign('/admin/login'); }
  finally { busy.value = false; }
}
async function impersonate(stop = false) {
  if (busy.value) return;
  error.value = ""; busy.value = true;
  try {
    if (stop) await auth.stopImpersonation(); else await auth.startImpersonation(previewRole.value);
    window.location.assign('/admin/dashboard');
  } catch (e) { error.value = e instanceof Error ? e.message : "Perubahan akses gagal."; }
  finally { busy.value = false; }
}
watch(() => route.fullPath, () => { document.title = String(route.meta.navTitle ?? 'Admin') + ' — Masjid Nurul Huda'; }, { immediate: true });
</script>
<template>
  <header>
    <p><strong>Masjid Nurul Huda — Administrasi</strong></p>
    <a href="#admin-content">Lewati navigasi</a>
    <p>{{ auth.user?.name }} · {{ auth.user?.role }}</p>
    <button :disabled="busy" @click="logout">Keluar</button>
    <p><a href="/">Website publik</a></p>
    <section v-if="auth.user?.impersonation" data-impersonation-banner aria-label="Pratinjau akses aktif">
      <strong>Pratinjau akses: {{ auth.user.role }}</strong>
      <p>Pelaku: {{ auth.user.impersonation.actor_name }}. Berakhir {{ new Date(auth.user.impersonation.expires_at * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) }} WIB.</p>
      <button :disabled="busy" @click="impersonate(true)">Kembali ke superadmin</button>
    </section>
    <details v-else-if="auth.user?.role === 'superadmin'">
      <summary>Pratinjau akses</summary>
      <p>Memulai sesi peran sementara yang diaudit oleh server.</p>
      <label>Peran <select v-model="previewRole"><option value="ketua">Ketua</option><option value="bendahara">Bendahara</option><option value="pengurus">Pengurus</option></select></label>
      <button :disabled="busy" @click="impersonate()">Mulai pratinjau</button>
    </details>
    <p v-if="error" role="alert">{{ error }}</p>
    <nav aria-label="Menu admin"><ul>
      <li><RouterLink to="/admin/dashboard">Dashboard</RouterLink></li>
      <li><RouterLink to="/admin/finance">Keuangan</RouterLink></li>
      <li><RouterLink to="/admin/media">Media</RouterLink></li>
      <li><RouterLink to="/admin/publikasi">Publikasi</RouterLink></li>
      <li v-if="settings"><RouterLink to="/admin/pengaturan">Pengaturan</RouterLink></li>
    </ul></nav>
  </header>
  <main id="admin-content" tabindex="-1"><RouterView :key="auth.user?.role" /></main>
</template>
