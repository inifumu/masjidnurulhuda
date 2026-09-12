<template>
  <nav aria-label="Halaman Pengaturan"><ul>
    <li><RouterLink to="/admin/pengaturan/kategori-kas">Kategori kas</RouterLink></li>
    <li><RouterLink to="/admin/pengaturan/seksi-pengurus">Seksi &amp; pengurus</RouterLink></li>
    <li v-if="auth.user?.role === 'superadmin'"><RouterLink to="/admin/pengaturan/akun-akses">Akun &amp; akses</RouterLink></li>
  </ul></nav>
  <RouterView />
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
const auth = useAuthStore();
</script>
