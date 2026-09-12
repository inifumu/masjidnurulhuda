<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useAdminShellTheme } from "@/composables/admin/useAdminShellTheme";
import NavigationSanggar from "./NavigationSanggar.vue";
import NavigationLentera from "./NavigationLentera.vue";
import NavigationMobile from "./NavigationMobile.vue";

const { activeAdminShell } = useAdminShellTheme();
const isMobile = ref(false);
const mobileDrawerVisible = ref(false);
let mobileQuery: MediaQueryList | undefined;

const syncViewport = (event?: MediaQueryListEvent) => {
  isMobile.value = event?.matches ?? mobileQuery?.matches ?? false;
};

onMounted(() => {
  mobileQuery = window.matchMedia("(max-width: 860px)");
  syncViewport();
  mobileQuery.addEventListener("change", syncViewport);
});

onBeforeUnmount(() => {
  mobileQuery?.removeEventListener("change", syncViewport);
});

const openNavigationDrawer = () => {
  mobileDrawerVisible.value = true;
};

defineExpose({
  openNavigationDrawer,
});
</script>

<template>
  <template v-if="activeAdminShell === 'lentera'">
    <NavigationLentera />
    <NavigationMobile v-if="isMobile" v-model:visible="mobileDrawerVisible" />
  </template>
  <template v-else-if="activeAdminShell === 'gapura'">
    <NavigationGapura v-model:visible="mobileDrawerVisible" />
  </template>
  <template v-else>
    <NavigationMobile v-if="isMobile" v-model:visible="mobileDrawerVisible" />
    <NavigationSanggar v-else />
  </template>
</template>
