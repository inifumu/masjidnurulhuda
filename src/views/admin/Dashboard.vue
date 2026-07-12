<!--
  Tujuan: Entrypoint view Dashboard pada Stage 2 dengan delegasi penuh ke bridge legacy.
  Caller: src/layouts/AdminLayout.vue (melalui router admin)
  Dependensi: src/components/legacy/DashboardLegacyBridge.vue
  Main Functions: menjaga kontrak route Dashboard tetap sama sambil memindahkan implementasi ke layer adapter.
  Side Effects: Tidak ada side effect langsung di view ini; side effect ada di bridge/composable.
-->
<script setup lang="ts">
import DashboardLegacyBridge from "../../components/legacy/DashboardLegacyBridge.vue";
</script>

<template>
  <DashboardLegacyBridge />
</template>
