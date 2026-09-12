<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useKas } from '@/composables/admin/useKas';
import { canAccessKasInput, canApprove } from '@/utils/permissions';
const auth = useAuthStore();
const { loadData } = useKas();
onMounted(() => void loadData().catch(() => undefined));
</script>
<template>
  <nav aria-label="Halaman Keuangan"><ul>
    <li><RouterLink to="/admin/finance/transaksi">Transaksi</RouterLink></li>
    <li v-if="canAccessKasInput(auth.user?.role)"><RouterLink to="/admin/finance/transaksi-langsung">Catat kas</RouterLink></li>
    <li><RouterLink to="/admin/finance/proposal">Proposal</RouterLink></li>
    <li v-if="canApprove(auth.user?.role)"><RouterLink to="/admin/finance/persetujuan">Persetujuan</RouterLink></li>
    <li v-if="['superadmin', 'ketua'].includes(auth.user?.role ?? '')"><RouterLink to="/admin/finance/riwayat-audit">Riwayat audit</RouterLink></li>
  </ul></nav>
  <RouterView />
</template>
