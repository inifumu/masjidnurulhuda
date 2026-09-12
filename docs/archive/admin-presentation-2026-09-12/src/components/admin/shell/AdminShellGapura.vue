<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminNavigation } from '@/composables/admin/useAdminNavigation';

import SidebarLayout from 'primevue/sidebarlayout';
import SidebarBackdrop from 'primevue/sidebarbackdrop';
import SidebarMain from 'primevue/sidebarmain';
import SidebarTrigger from 'primevue/sidebartrigger';
import Sidebar from 'primevue/sidebar';
import SidebarAside from 'primevue/sidebaraside';
import SidebarPanel from 'primevue/sidebarpanel';
import SidebarHeader from 'primevue/sidebarheader';
import SidebarMenu from 'primevue/sidebarmenu';
import SidebarMenuItem from 'primevue/sidebarmenuitem';
import SidebarMenuButton from 'primevue/sidebarmenubutton';
import SidebarContent from 'primevue/sidebarcontent';
import SidebarGroup from 'primevue/sidebargroup';
import SidebarGroupLabel from 'primevue/sidebargrouplabel';
import SidebarGroupContent from 'primevue/sidebargroupcontent';
import SidebarSpacer from 'primevue/sidebarspacer';

const router = useRouter();
const { visibleGroups, isGroupActive } = useAdminNavigation();

const isMobile = ref(false);
const open = ref(true);

let mql: MediaQueryList | null = null;
let onMqlChange: ((event: MediaQueryListEvent) => void) | null = null;

onMounted(() => {
    if (typeof window === 'undefined') return;
    mql = window.matchMedia('(max-width: 1023px)');
    isMobile.value = mql.matches;
    open.value = !isMobile.value;
    onMqlChange = (event) => {
        isMobile.value = event.matches;
        open.value = !event.matches;
    };
    mql.addEventListener('change', onMqlChange);
});

onBeforeUnmount(() => {
    if (mql && onMqlChange) {
        mql.removeEventListener('change', onMqlChange);
    }
});

const goTo = (to?: string) => {
  if (to) {
    void router.push(to);
    if (isMobile.value) {
      open.value = false;
    }
  }
};
</script>

<template>
  <SidebarLayout class="min-h-screen !relative">
    <SidebarBackdrop v-if="(isMobile) && open" class="!absolute" />
    
    <Sidebar id="gapura-sidebar" variant="floating" :collapsible="isMobile ? 'offcanvas' : 'icon'" side="left" :overlay="isMobile" v-model:open="open">
      <SidebarSpacer />
      <SidebarAside>
        <SidebarPanel>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton class="!px-1">
                  <div class="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-bold leading-none">
                    <img src="/logo.png" alt="Logo" class="w-full h-full object-contain" />
                  </div>
                  <span class="font-semibold text-sm">Ruang Pengurus</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel class="uppercase text-xs font-semibold opacity-70 tracking-wider">Menu Utama</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="item in visibleGroups" :key="item.label">
                    <SidebarMenuButton 
                      :isActive="isGroupActive(item)"
                      :disabled="item.planned"
                      @click="goTo(item.to)"
                    >
                      <i :class="item.icon" aria-hidden="true" />
                      <span>{{ item.label }}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </SidebarPanel>
      </SidebarAside>
    </Sidebar>

    <SidebarMain>
      <header class="admin-shell-header !m-0 !rounded-none border-x-0 border-t-0 shadow-sm" style="display: flex; justify-content: space-between; align-items: center;">
        <div class="admin-header-leading">
          <SidebarTrigger severity="secondary" target="gapura-sidebar" :text="true" size="small">
            <i class="pi pi-bars" aria-hidden="true" />
          </SidebarTrigger>
          <slot name="header-identity" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <slot name="header-actions" />
        </div>
      </header>
      
      <main class="admin-shell-content">
        <slot />
      </main>
    </SidebarMain>
  </SidebarLayout>
</template>
