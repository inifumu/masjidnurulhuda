<!--
  Tujuan: Entrypoint view Pengaturan pada Stage 2 dengan delegasi penuh ke bridge legacy.
  Caller: src/layouts/AdminLayout.vue (melalui router admin)
  Dependensi: src/components/legacy/PengaturanLegacyBridge.vue
  Main Functions: menjaga kontrak route Pengaturan tetap sama sambil memindahkan implementasi ke layer adapter.
  Side Effects: Tidak ada side effect langsung di view ini; side effect ada di bridge/composable.
-->
<script setup lang="ts">
import PengaturanLegacyBridge from "../../components/legacy/PengaturanLegacyBridge.vue";
</script>

<template>
  <PengaturanLegacyBridge />
</template>
