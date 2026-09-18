<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute } from "vue-router"
import {
  Image,
  Landmark,
  LayoutDashboard,
  Newspaper,
  Settings,
} from "lucide-vue-next"
import AdminThemeToggle from "@/components/admin/AdminThemeToggle.vue"
import AppSidebar from "@/components/admin/AppSidebar.vue"
import type { AdminNavItem } from "@/components/admin/NavMain.vue"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import DialogRoot from "@/components/ui/dialog/Dialog.vue"
import DialogContent from "@/components/ui/dialog/DialogContent.vue"
import DialogDescription from "@/components/ui/dialog/DialogDescription.vue"
import DialogFooter from "@/components/ui/dialog/DialogFooter.vue"
import DialogHeader from "@/components/ui/dialog/DialogHeader.vue"
import DialogTitle from "@/components/ui/dialog/DialogTitle.vue"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuthStore, type AuthRole } from "@/stores/authStore"
import { canAccessKasInput, canApprove } from "@/utils/permissions"

const auth = useAuthStore()
const route = useRoute()
const busy = ref(false)
const error = ref("")
const previewError = ref("")
const previewRole = ref<Exclude<AuthRole, "superadmin">>("pengurus")
const previewDialogOpen = ref(false)

const navItems = computed<AdminNavItem[]>(() => {
  const role = auth.user?.role

  return [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      to: "/admin/finance",
      label: "Keuangan",
      icon: Landmark,
      children: [
        { to: "/admin/finance/transaksi", label: "Transaksi" },
        ...(canAccessKasInput(role) ? [{ to: "/admin/finance/transaksi-langsung", label: "Catat kas" }] : []),
        { to: "/admin/finance/proposal", label: "Proposal" },
        ...(canApprove(role) ? [{ to: "/admin/finance/persetujuan", label: "Persetujuan" }] : []),
        ...(["superadmin", "ketua"].includes(role ?? "") ? [{ to: "/admin/finance/riwayat-audit", label: "Riwayat audit" }] : []),
      ],
    },
    {
      to: "/admin/media",
      label: "Media",
      icon: Image,
      children: [
        { to: "/admin/media", label: "Pustaka media" },
        { to: "/admin/galeri-dokumentasi", label: "Galeri & dokumentasi" },
      ],
    },
    {
      to: "/admin/publikasi",
      label: "Publikasi",
      icon: Newspaper,
      children: [
        { to: "/admin/publikasi/kabar-masjid", label: "Kabar masjid" },
        { to: "/admin/publikasi/kegiatan", label: "Kegiatan" },
        { to: "/admin/publikasi/kritik-saran", label: "Kritik & saran" },
      ],
    },
    {
      to: "/admin/pengaturan",
      label: "Pengaturan",
      icon: Settings,
      children: role === "superadmin"
        ? [
            { to: "/admin/pengaturan/kategori-kas", label: "Kategori kas" },
            { to: "/admin/pengaturan/seksi-pengurus", label: "Seksi & pengurus" },
            { to: "/admin/pengaturan/akun-akses", label: "Akun & akses" },
          ]
        : role === "ketua"
          ? [
              { to: "/admin/pengaturan/kategori-kas", label: "Kategori kas" },
              { to: "/admin/pengaturan/seksi-pengurus", label: "Seksi & pengurus" },
            ]
          : [],
    },
  ]
})

const routeGroup = computed(() => String(route.meta.navGroup ?? "Admin"))
const routeTitle = computed(() => String(route.meta.navTitle ?? routeGroup.value))

async function logout() {
  if (busy.value) return
  busy.value = true
  try {
    await auth.logout()
    window.location.assign("/admin/login")
  } finally {
    busy.value = false
  }
}

async function impersonate(stop = false) {
  if (busy.value) return
  error.value = ""
  previewError.value = ""
  busy.value = true
  try {
    if (stop) await auth.stopImpersonation()
    else await auth.startImpersonation(previewRole.value)
    window.location.assign("/admin/dashboard")
  } catch (e) {
    const message = e instanceof Error ? e.message : "Perubahan akses gagal."
    if (stop) error.value = message
    else previewError.value = message
  } finally {
    busy.value = false
  }
}

function openPreviewDialog() {
  previewError.value = ""
  previewDialogOpen.value = true
}

watch(() => route.fullPath, () => {
  document.title = String(route.meta.navTitle ?? "Admin") + " — Masjid Nurul Huda"
}, { immediate: true })
</script>

<template>
  <SidebarProvider data-admin-shell class="min-h-dvh max-w-full overflow-x-clip bg-sidebar">
    <a href="#admin-content" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-3 focus:text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring">
      Lewati navigasi
    </a>

    <AppSidebar
      :items="navItems"
      :user-name="auth.user?.name ?? 'Pengguna admin'"
      :user-role="auth.user?.role ?? 'admin'"
      :can-impersonate="auth.user?.role === 'superadmin'"
      :busy="busy"
      @impersonate="openPreviewDialog"
      @logout="logout"
    />

    <SidebarInset id="admin-content" tabindex="-1">
      <header class="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
        <div class="flex min-w-0 items-center gap-2">
          <SidebarTrigger class="-ml-1 bg-background hover:bg-accent hover:text-accent-foreground" aria-label="Buka menu admin" />
          <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb aria-label="Konteks halaman" class="min-w-0">
            <BreadcrumbList class="flex-nowrap">
              <BreadcrumbItem class="hidden sm:inline-flex">
                <span>{{ routeGroup }}</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator v-if="routeTitle !== routeGroup" class="hidden sm:list-item" />
              <BreadcrumbItem>
                <BreadcrumbPage class="max-w-[13rem] truncate sm:max-w-none">{{ routeTitle }}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <AdminThemeToggle />
      </header>

      <section v-if="auth.user?.impersonation" data-impersonation-banner class="border-b-4 border-secondary bg-secondary/20 px-4 py-3 sm:px-6" aria-label="Pratinjau akses aktif">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0 text-sm">
            <p class="font-semibold">Pratinjau akses: {{ auth.user.role }}</p>
            <p class="mt-1">Pelaku: {{ auth.user.impersonation.actor_name }}. Peran efektif: {{ auth.user.role }}. Berakhir {{ new Date(auth.user.impersonation.expires_at * 1000).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) }} WIB.</p>
          </div>
          <Button :disabled="busy" variant="outline" @click="impersonate(true)">
            Kembali ke superadmin
          </Button>
        </div>
      </section>
      <p v-if="error" role="alert" class="border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm sm:px-6">{{ error }}</p>

      <div class="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0">
        <RouterView :key="auth.user?.role" />
      </div>
    </SidebarInset>

    <DialogRoot v-model:open="previewDialogOpen">
      <DialogContent aria-label="Pratinjau akses">
        <DialogHeader>
          <DialogTitle>Pratinjau akses</DialogTitle>
          <DialogDescription>Mulai sesi peran sementara yang diaudit dan dibatasi oleh server.</DialogDescription>
        </DialogHeader>

        <fieldset class="grid gap-3" :disabled="busy">
          <legend class="text-sm font-medium">Peran efektif</legend>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button type="button" :variant="previewRole === 'ketua' ? 'secondary' : 'outline'" :aria-pressed="previewRole === 'ketua'" @click="previewRole = 'ketua'">Ketua</Button>
            <Button type="button" :variant="previewRole === 'bendahara' ? 'secondary' : 'outline'" :aria-pressed="previewRole === 'bendahara'" @click="previewRole = 'bendahara'">Bendahara</Button>
            <Button type="button" :variant="previewRole === 'pengurus' ? 'secondary' : 'outline'" :aria-pressed="previewRole === 'pengurus'" @click="previewRole = 'pengurus'">Pengurus</Button>
          </div>
        </fieldset>

        <p v-if="previewError" role="alert" class="text-sm text-destructive">{{ previewError }}</p>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="busy" @click="previewDialogOpen = false">Batal</Button>
          <Button type="button" :disabled="busy" @click="impersonate()">{{ busy ? "Memproses…" : "Mulai pratinjau" }}</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  </SidebarProvider>
</template>
