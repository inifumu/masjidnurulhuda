<!--
  Tujuan: Entrypoint view KeuanganKas pada Stage 2 dengan delegasi penuh ke bridge legacy.
  Caller: src/layouts/AdminLayout.vue (melalui router admin)
  Dependensi: src/components/legacy/KeuanganKasLegacyBridge.vue
  Main Functions: menjaga kontrak route KeuanganKas tetap sama sambil memindahkan implementasi ke layer adapter.
  Side Effects: Tidak ada side effect langsung di view ini; side effect ada di bridge/composable.
-->
<script setup lang="ts">
import KeuanganKasLegacyBridge from "../../components/legacy/KeuanganKasLegacyBridge.vue";
</script>

<template>
  <KeuanganKasLegacyBridge />
</template>
