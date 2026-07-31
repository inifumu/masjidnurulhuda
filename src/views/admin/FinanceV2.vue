<!-- Host tipis workflow keuangan. Domain state dan mutation tetap dimiliki child view/composable. -->
<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { ClipboardCheck, FileClock, History, Landmark, PlusCircle } from "lucide-vue-next";
import { useAuthStore } from "@/stores/authStore";
import { canApprove } from "@/utils/permissions";

const route = useRoute();
const authStore = useAuthStore();

const workflows = computed(() => [
  { name: "admin-finance-transactions", label: "Transaksi", description: "Buku kas", icon: Landmark, visible: true },
  { name: "admin-finance-direct-transaction", label: "Catat kas", description: "Pencatatan rutin", icon: PlusCircle, visible: ["superadmin", "ketua", "bendahara"].includes(authStore.user?.role ?? "") },
  { name: "admin-finance-proposals", label: "Proposal", description: "Pengajuan dana", icon: FileClock, visible: true },
  { name: "admin-finance-approvals", label: "Persetujuan", description: "Antrean keputusan", icon: ClipboardCheck, visible: canApprove(authStore.user?.role) },
  { name: "admin-finance-audit", label: "Riwayat audit", description: "Jejak perubahan", icon: History, visible: true },
].filter((item) => item.visible));

const revealWorkflow = (event: FocusEvent) => {
  (event.currentTarget as HTMLElement).scrollIntoView({ block: "nearest", inline: "center" });
};
</script>

<template>
  <section class="space-y-5 pb-12">
    <nav aria-label="Workflow keuangan" class="flex gap-1 overflow-x-auto border-b pb-2">
      <RouterLink
        v-for="item in workflows"
        :key="item.name"
        :to="{ name: item.name }"
        class="group flex min-h-11 shrink-0 items-center gap-3 rounded-md border bg-card px-3 py-2 transition-colors hover:border-primary/40 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="route.name === item.name ? 'border-primary bg-primary/5 shadow-[inset_0_-2px_var(--primary)]' : ''"
        :aria-current="route.name === item.name ? 'page' : undefined"
        @focus="revealWorkflow"
      >
        <span
          class="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-primary"
          :class="route.name === item.name ? 'bg-primary/10 text-primary' : ''"
        >
          <component :is="item.icon" class="size-4" />
        </span>
        <span class="min-w-0">
          <strong class="block whitespace-nowrap text-sm">{{ item.label }}</strong>
        </span>
      </RouterLink>
    </nav>

    <RouterView />
  </section>
</template>
