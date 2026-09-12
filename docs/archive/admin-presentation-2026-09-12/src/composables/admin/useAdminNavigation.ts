import { computed } from "vue";
import { useAuthStore, type AuthRole } from "@/stores/authStore";
import { useRoute } from "vue-router";

export type NavigationGroup = {
  label: string;
  icon: string;
  to?: string;
  roles?: AuthRole[];
  planned?: boolean;
};

const navigation: NavigationGroup[] = [
  { label: "Ringkasan", icon: "pi pi-home", to: "/admin/dashboard" },
  { label: "Keuangan", icon: "pi pi-wallet", to: "/admin/finance" },
  { label: "Media", icon: "pi pi-images", planned: true },
  { label: "Publikasi", icon: "pi pi-megaphone", planned: true },
  { label: "Pengaturan", icon: "pi pi-cog", to: "/admin/pengaturan", roles: ["superadmin", "ketua"] },
];

export function useAdminNavigation() {
  const authStore = useAuthStore();
  const route = useRoute();

  const visibleGroups = computed(() =>
    navigation.filter((group) => !group.roles || (!!authStore.user && group.roles.includes(authStore.user.role)))
  );

  const isGroupActive = (group: NavigationGroup) => {
    if (!group.to) return false;
    return route.path.startsWith(group.to);
  };

  return {
    visibleGroups,
    isGroupActive,
  };
}
