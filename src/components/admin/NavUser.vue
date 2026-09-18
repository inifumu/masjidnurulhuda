<script setup lang="ts">
import { ChevronsUpDown, Eye, ExternalLink, LogOut, UserRound } from "lucide-vue-next"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const props = defineProps<{
  name: string
  role: string
  canImpersonate: boolean
  busy: boolean
}>()
const emit = defineEmits<{
  impersonate: []
  logout: []
}>()
const { isMobile } = useSidebar()

function openPublicWebsite() {
  window.location.assign("/")
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            :disabled="props.busy"
            aria-label="Buka menu sesi"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarFallback class="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                <UserRound aria-hidden="true" class="size-4" />
              </AvatarFallback>
            </Avatar>
            <span class="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ props.name }}</span>
              <span class="truncate text-xs capitalize text-sidebar-foreground/70">{{ props.role }}</span>
            </span>
            <ChevronsUpDown aria-hidden="true" class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarFallback class="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                  <UserRound aria-hidden="true" class="size-4" />
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ props.name }}</span>
                <span class="truncate text-xs capitalize">{{ props.role }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem v-if="props.canImpersonate" @select="emit('impersonate')">
            <Eye aria-hidden="true" />
            Pratinjau akses
          </DropdownMenuItem>
          <DropdownMenuItem @select="openPublicWebsite">
            <ExternalLink aria-hidden="true" />
            Website publik
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem :disabled="props.busy" @select="emit('logout')">
            <LogOut aria-hidden="true" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
