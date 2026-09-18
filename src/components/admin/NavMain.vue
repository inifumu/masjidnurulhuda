<script setup lang="ts">
import type { Component } from "vue"
import { ChevronRight } from "lucide-vue-next"
import { useRoute } from "vue-router"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export type AdminNavChild = {
  to: string
  label: string
}

export type AdminNavItem = {
  to: string
  label: string
  icon: Component
  children?: AdminNavChild[]
}

const props = defineProps<{ items: AdminNavItem[] }>()
const route = useRoute()
const { isMobile, open, setOpen, setOpenMobile } = useSidebar()

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function isChildActive(to: string) {
  return route.path === to
}

async function navigateTo(
  navigate: (event?: MouseEvent) => unknown | Promise<unknown>,
  event: MouseEvent,
) {
  await navigate(event)
  if (isMobile.value) setOpenMobile(false)
}

function toggleSubmenu() {
  if (!isMobile.value && !open.value) setOpen(true)
}
</script>

<template>
  <nav aria-label="Menu admin">
    <h2 class="sr-only">Menu admin</h2>
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <Collapsible
            v-for="item in props.items"
            :key="item.to"
            as-child
            :default-open="isActive(item.to)"
          >
            <SidebarMenuItem>
              <RouterLink v-slot="{ href, navigate }" :to="item.to" custom>
                <SidebarMenuButton as-child :is-active="isActive(item.to)" :tooltip="item.label">
                  <a :href="href" @click="navigateTo(navigate, $event)">
                    <component :is="item.icon" aria-hidden="true" />
                    <span>{{ item.label }}</span>
                  </a>
                </SidebarMenuButton>
              </RouterLink>

              <template v-if="item.children?.length">
                <CollapsibleTrigger as-child>
                  <SidebarMenuAction
                    class="peer-data-[size=default]/menu-button:top-2 data-[state=open]:rotate-90"
                    @click="toggleSubmenu"
                  >
                    <ChevronRight aria-hidden="true" />
                    <span class="sr-only">Buka submenu {{ item.label }}</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub class="pt-1">
                    <SidebarMenuSubItem v-for="child in item.children" :key="child.to">
                      <RouterLink v-slot="{ href, navigate }" :to="child.to" custom>
                        <SidebarMenuSubButton as-child :is-active="isChildActive(child.to)">
                          <a :href="href" @click="navigateTo(navigate, $event)">
                            <span>{{ child.label }}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </RouterLink>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </template>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </nav>
</template>
