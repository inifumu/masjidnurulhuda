<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MoreVertical,
  Settings,
  Wallet,
} from "lucide-vue-next";
import type { AdminRole } from "../../../../shared/contracts/index";
import { toast } from "vue-sonner";
import { useAuthStore } from "@/stores/authStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

const props = defineProps<{ isLoggingOut: boolean }>();
const emit = defineEmits<{ logout: [] }>();
const route = useRoute();
const authStore = useAuthStore();
const { isMobile, state, setOpen, setOpenMobile } = useSidebar();

const allRoles: readonly AdminRole[] = ["superadmin", "ketua", "bendahara", "pengurus"];
type NavigationLeaf = { name: string; to: string; roles: readonly AdminRole[] };
type NavigationGroup = { name: string; icon: typeof LayoutDashboard; roles: readonly AdminRole[]; to?: string; exact?: boolean; children?: NavigationLeaf[] };

const navigationGroups: NavigationGroup[] = [
  { name: "Ringkasan", icon: LayoutDashboard, to: "/admin/dashboard", exact: true, roles: allRoles },
  { name: "Keuangan", icon: Wallet, roles: allRoles, children: [{ name: "Keuangan", to: "/admin/finance", roles: allRoles }] },
  { name: "Media & publikasi", icon: FolderOpen, roles: allRoles, children: [
    { name: "Pustaka media", to: "/admin/media", roles: allRoles },
    { name: "Galeri & dokumentasi", to: "/admin/galeri-dokumentasi", roles: allRoles },
  ] },
  { name: "Pengaturan", icon: Settings, roles: ["superadmin", "ketua"], children: [{ name: "Pengaturan", to: "/admin/pengaturan", roles: ["superadmin", "ketua"] }] },
];

const visibleNavigationGroups = computed(() => {
  const role = authStore.user?.role;
  if (!role) return [];
  return navigationGroups
    .filter((group) => group.roles.includes(role))
    .map((group) => ({ ...group, children: group.children?.filter((child) => child.roles.includes(role)) }));
});
const isActiveRoute = (path: string, exact = false) => exact ? route.path === path || route.path === "/admin" : route.path.startsWith(path);
const isGroupActive = (group: NavigationGroup) => Boolean(group.to && isActiveRoute(group.to, group.exact)) || Boolean(group.children?.some((child) => isActiveRoute(child.to)));
const openGroups = ref<Record<string, boolean>>({});
const toggleGroup = (groupName: string) => {
  if (state.value === "collapsed") {
    setOpen(true);
    openGroups.value[groupName] = true;
    return;
  }
  openGroups.value[groupName] = !openGroups.value[groupName];
};
watch(() => route.path, () => {
  for (const group of visibleNavigationGroups.value) if (group.children && isGroupActive(group)) openGroups.value[group.name] = true;
  setOpenMobile(false);
}, { immediate: true });

const userInitials = computed(() => (authStore.user?.name || "Admin").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase());
const roleLabel = computed(() => ({ superadmin: "Superadmin", ketua: "Ketua", bendahara: "Bendahara", pengurus: "Pengurus" })[authStore.user?.role ?? "pengurus"]);
const isChangingRole = ref(false);
const previewRoles = ["ketua", "bendahara", "pengurus"] as const;
const startImpersonation = async (role: typeof previewRoles[number]) => {
  if (isChangingRole.value) return;
  isChangingRole.value = true;
  try {
    await authStore.startImpersonation(role);
    toast.success(`Mode samaran ${role} aktif.`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Gagal memulai mode samaran.");
  } finally { isChangingRole.value = false; }
};
</script>

<template>
  <Sidebar id="admin-sidebar-navigation" collapsible="icon" aria-label="Navigasi admin">
    <SidebarHeader class="h-16 shrink-0 justify-center border-b border-sidebar-border px-3 py-0 transition-[padding] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:px-2.5">
      <div class="flex h-11 min-w-0 items-center gap-2 transition-[gap] duration-200 ease-linear motion-reduce:transition-none md:h-8 group-data-[collapsible=icon]:gap-0">
        <img src="/logo.png" alt="" class="size-9 shrink-0 object-contain transition-[width,height,transform] duration-200 ease-linear motion-reduce:transition-none md:size-8 group-data-[collapsible=icon]:size-7" />
        <span class="min-w-0 max-w-44 overflow-hidden opacity-100 transition-[max-width,opacity] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0"><span class="block truncate text-sm font-semibold text-foreground">Masjid Nurul Huda</span><span class="block truncate text-xs text-muted-foreground">Ruang kerja pengurus</span></span>
      </div>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup class="px-3 py-2 group-data-[collapsible=icon]:px-2">
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="group in visibleNavigationGroups" :key="group.name">
              <SidebarMenuButton v-if="group.to" as-child :tooltip="group.name" :is-active="isGroupActive(group)" class="h-11 px-3 [&_svg]:!size-5 md:h-8 md:px-2 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-1.5!">
                <router-link :to="group.to"><component :is="group.icon" /><span>{{ group.name }}</span></router-link>
              </SidebarMenuButton>
              <Collapsible v-else :open="openGroups[group.name]" as-child class="group/collapsible">
                <div>
                  <CollapsibleTrigger as-child>
                    <SidebarMenuButton :tooltip="group.name" class="h-11 px-3 [&_svg]:!size-5 data-[state=open]:text-sidebar-accent-foreground md:h-8 md:px-2 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-1.5!" @click="toggleGroup(group.name)">
                      <component :is="group.icon" /><span>{{ group.name }}</span><ChevronRight class="ml-auto transition-transform duration-200 motion-reduce:transition-none" :class="openGroups[group.name] && 'rotate-90'" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem v-for="child in group.children" :key="child.to">
                        <SidebarMenuSubButton as-child :is-active="isActiveRoute(child.to)" class="h-11 px-3 md:h-8 md:px-2"><router-link :to="child.to"><span class="truncate">{{ child.name }}</span></router-link></SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="shrink-0 border-t border-sidebar-border p-2">
      <div class="flex h-12 items-center gap-2 group-data-[collapsible=icon]:justify-center">
        <div data-profile-summary class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden group-data-[collapsible=icon]:hidden">
          <Avatar class="size-8 shrink-0 rounded-md"><AvatarFallback class="rounded-md bg-primary text-[10px] text-primary-foreground">{{ userInitials }}</AvatarFallback></Avatar>
          <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ authStore.user?.name || "Administrator" }}<span class="block text-xs font-normal text-muted-foreground md:hidden">{{ roleLabel }}</span></span>
        </div>
        <DropdownMenu><DropdownMenuTrigger as-child>
          <IconButton data-account-trigger class="mr-1 size-11! shrink-0 rounded-md [&_svg]:!size-5 md:mr-0 md:size-8!" label="Buka menu akun"><MoreVertical /></IconButton>
        </DropdownMenuTrigger><DropdownMenuContent :side="isMobile ? 'top' : 'right'" align="end" :side-offset="8" :collision-padding="12" class="w-[min(15rem,calc(100vw-1.5rem))] rounded-md md:w-60">
          <DropdownMenuLabel><p class="truncate text-sm font-semibold">{{ authStore.user?.name || "Administrator" }}</p><p class="mt-1 text-xs font-normal text-muted-foreground">{{ roleLabel }}</p></DropdownMenuLabel><DropdownMenuSeparator />
          <template v-if="authStore.user?.role === 'superadmin' && !authStore.user?.impersonation">
            <DropdownMenuLabel class="text-xs font-normal text-muted-foreground">Lihat dan bertindak sebagai</DropdownMenuLabel>
            <DropdownMenuItem v-for="role in previewRoles" :key="role" :disabled="isChangingRole" class="h-[44px]! py-0 md:h-[32px]!" @select="startImpersonation(role)">Role {{ ({ ketua: 'Ketua', bendahara: 'Bendahara', pengurus: 'Pengurus' })[role] }}</DropdownMenuItem>
            <DropdownMenuSeparator />
          </template>
          <DropdownMenuItem variant="destructive" :disabled="props.isLoggingOut" class="h-[44px]! py-0 md:h-[32px]! [&_svg]:!size-5" @select="emit('logout')"><LogOut />{{ props.isLoggingOut ? "Mengakhiri sesi..." : "Keluar" }}</DropdownMenuItem>
        </DropdownMenuContent></DropdownMenu>
      </div>
    </SidebarFooter>
  </Sidebar>
</template>
