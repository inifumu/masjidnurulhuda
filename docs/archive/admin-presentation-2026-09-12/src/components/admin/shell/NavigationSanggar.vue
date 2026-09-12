<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAdminShellTheme } from "@/composables/admin/useAdminShellTheme";
import { useAdminNavigation } from "@/composables/admin/useAdminNavigation";

const router = useRouter();
const { sanggarNavigationMode, toggleSanggarNavigationMode } = useAdminShellTheme();
const { visibleGroups, isGroupActive } = useAdminNavigation();

const sanggarToggleTooltip = computed(() => ({
  value: sanggarNavigationMode.value === "expanded" ? "Ciutkan navigasi" : "Perluas navigasi",
  showDelay: 180,
  hideDelay: 0,
}));

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
  <aside class="admin-shell-side" aria-label="Navigasi utama admin">
    <div class="admin-brand-lockup">
      <img src="/logo.png" alt="Logo Masjid" class="admin-brand-logo" />
      <div class="admin-brand-copy">
        <strong>Nurul Huda</strong>
        <span>Ruang pengurus</span>
      </div>
    </div>

    <nav class="admin-primary-navigation">
      <section
        v-for="group in visibleGroups"
        :key="group.label"
        class="admin-navigation-group"
        v-tooltip.right="sanggarNavigationMode === 'collapsed' ? group.label : undefined"
      >
        <button
          type="button"
          class="admin-navigation-primary"
          :class="{ 'is-active': isGroupActive(group), 'is-planned': group.planned }"
          :aria-disabled="group.planned || undefined"
          :aria-label="group.label"
          :disabled="group.planned"
          v-ripple
          @click="openGroup(group)"
        >
          <i :class="group.icon" aria-hidden="true" />
          <span>{{ group.label }}</span>
        </button>
      </section>
    </nav>

    <button
      type="button"
      class="admin-sidebar-float-toggle"
      :aria-label="sanggarNavigationMode === 'expanded' ? 'Ciutkan navigasi' : 'Perluas navigasi'"
      :aria-pressed="sanggarNavigationMode === 'collapsed'"
      v-tooltip.right="sanggarToggleTooltip"
      v-ripple
      @click="toggleSanggarNavigationMode"
    >
      <i :class="sanggarNavigationMode === 'expanded' ? 'pi pi-angle-left' : 'pi pi-angle-right'" aria-hidden="true" />
    </button>
  </aside>
</template>
