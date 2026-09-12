<script setup lang="ts">

import { useRouter } from "vue-router";
import Drawer from "primevue/drawer";
import Tag from "primevue/tag";
import { useAdminNavigation } from "@/composables/admin/useAdminNavigation";

const visible = defineModel<boolean>("visible", { default: false });

const router = useRouter();
const { visibleGroups, isGroupActive } = useAdminNavigation();

const goTo = async (to?: string) => {
  if (!to) return;
  visible.value = false;
  await router.push(to);
};

const openGroup = (group: any) => {
  if (group.planned) return;
  if (group.to) {
    void goTo(group.to);
  }
};
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="left"
    class="admin-navigation-drawer"
    :close-button-props="{ 'aria-label': 'Tutup navigasi' }"
  >
    <template #header>
      <div class="admin-drawer-brand">
        <img src="/logo.png" alt="Logo Masjid" />
        <div><strong>Masjid Nurul Huda</strong><span>Navigasi admin</span></div>
      </div>
    </template>
    <nav class="admin-drawer-navigation" aria-label="Navigasi mobile admin">
      <div class="admin-drawer-intro"><strong>Navigasi utama</strong><span>Pilih ruang kerja yang ingin dibuka.</span></div>
      <div class="admin-drawer-groups">
        <section
          v-for="group in visibleGroups"
          :key="group.label"
          class="admin-drawer-group"
          :class="{ 'is-active': isGroupActive(group), 'is-planned': group.planned }"
        >
          <button
            type="button"
            class="admin-drawer-primary w-full text-left"
            :aria-disabled="group.planned || undefined"
            :disabled="group.planned"
            v-ripple
            @click="openGroup(group)"
          >
            <span class="admin-drawer-primary-icon"><i :class="group.icon" aria-hidden="true" /></span>
            <span class="admin-drawer-primary-copy">
              <strong>{{ group.label }}</strong>
            </span>
            <Tag v-if="group.planned" value="Segera" severity="secondary" />
          </button>
        </section>
      </div>
    </nav>
  </Drawer>
</template>
