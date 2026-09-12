<script setup lang="ts">
import { useRouter } from "vue-router";
import Dock from "primevue/dock";
import { useAdminNavigation } from "@/composables/admin/useAdminNavigation";

const router = useRouter();
const { visibleGroups, isGroupActive } = useAdminNavigation();

const goTo = async (to?: string) => {
  if (!to) return;
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
  <Dock :model="visibleGroups" position="bottom" class="admin-lentera-dock" aria-label="Navigasi Lentera">
    <template #item="{ item }">
      <button
        type="button"
        class="admin-dock-button"
        :class="{ 'is-active': isGroupActive(item as any), 'is-planned': item.planned }"
        :aria-label="(item.label as string)"
        :disabled="item.planned"
        v-ripple
        @click="openGroup(item)"
      >
        <i :class="item.icon" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </button>
    </template>
  </Dock>
</template>
