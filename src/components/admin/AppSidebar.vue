<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"
import type { AdminNavItem } from "./NavMain.vue"
import logoTransUrl from "@/assets/logo-trans.png"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import NavMain from "./NavMain.vue"
import NavUser from "./NavUser.vue"

const props = withDefaults(defineProps<SidebarProps & {
  items: AdminNavItem[]
  userName: string
  userRole: string
  canImpersonate: boolean
  busy: boolean
}>(), {
  variant: "inset",
  collapsible: "icon",
})
const emit = defineEmits<{
  impersonate: []
  logout: []
}>()
</script>

<template>
  <Sidebar :side="props.side" :variant="props.variant" :collapsible="props.collapsible" :class="props.class">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <RouterLink to="/admin/dashboard" aria-label="Masjid Nurul Huda">
              <span class="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-sidebar-primary-foreground">
                <img data-admin-logo :src="logoTransUrl" alt="" class="size-8 rounded-lg bg-white object-contain" />
              </span>
              <span class="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">Masjid Nurul Huda</span>
                <span class="truncate text-xs text-sidebar-foreground/70">Administrasi pengurus</span>
              </span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <NavMain :items="props.items" />
    </SidebarContent>

    <SidebarFooter>
      <NavUser
        :name="props.userName"
        :role="props.userRole"
        :can-impersonate="props.canImpersonate"
        :busy="props.busy"
        @impersonate="emit('impersonate')"
        @logout="emit('logout')"
      />
    </SidebarFooter>
  </Sidebar>
</template>
