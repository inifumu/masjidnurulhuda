<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import IonIcon from '../components/IonIcon.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const drawerOpen = ref(false)
const accountOpen = ref(false)
const busy = ref(false)
const error = ref('')

const navItems = computed(() => [
  { to: '/varletm3/dashboard', label: 'Ringkasan', icon: 'home-outline', visible: true },
  { to: '/varletm3/keuangan/transaksi', label: 'Keuangan', icon: 'wallet-outline', visible: true },
  { to: '/varletm3/media', label: 'Media', icon: 'images-outline', visible: true },
  { to: '/varletm3/publikasi', label: 'Publikasi', icon: 'newspaper-outline', visible: true },
  { to: '/varletm3/pengaturan/kategori-kas', label: 'Pengaturan', icon: 'settings-outline', visible: ['superadmin', 'ketua'].includes(auth.user?.role ?? '') },
].filter((item) => item.visible))

const isActive = (path: string) => route.path.startsWith(path.split('/').slice(0, 3).join('/'))

async function navigate(path: string) {
  drawerOpen.value = false
  await router.push(path)
}

async function logout() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await auth.logout()
    window.location.assign('/varletm3/login')
  } catch (cause: unknown) {
    error.value = cause instanceof Error ? cause.message : 'Tidak dapat keluar'
  } finally {
    busy.value = false
  }
}

watch(() => route.fullPath, () => {
  document.title = `${String(route.meta.navTitle ?? 'Admin')} | Masjid Nurul Huda`
})
</script>

<template>
  <var-app-bar :title="String(route.meta.navTitle ?? 'Masjid Nurul Huda')" fixed placeholder type="primary" :elevation="1">
    <template #left>
      <var-button icon round text color="currentColor" aria-label="Buka menu" @click="drawerOpen = true">
        <IonIcon name="menu-outline" />
      </var-button>
    </template>
    <template #right>
      <var-button icon round text color="currentColor" aria-label="Buka akun" @click="accountOpen = true">
        <IonIcon name="person-circle-outline" />
      </var-button>
    </template>
  </var-app-bar>

  <var-popup v-model:show="drawerOpen" position="left">
    <var-paper width="280px" height="100vh" :elevation="3" surface="low">
      <var-cell title="Masjid Nurul Huda" description="Panel administrasi">
        <template #icon><IonIcon name="business-outline" :size="28" color="var(--color-primary)" /></template>
      </var-cell>
      <var-divider />
      <var-cell-group>
        <var-cell
          v-for="item in navItems"
          :key="item.to"
          :title="item.label"
          :ripple="true"
          :border="false"
          @click="navigate(item.to)"
        >
          <template #icon><IonIcon :name="item.icon" color="var(--color-primary)" /></template>
          <template #extra><IonIcon v-if="isActive(item.to)" name="radio-button-on" color="var(--color-secondary)" /></template>
        </var-cell>
      </var-cell-group>
    </var-paper>
  </var-popup>

  <var-paper :elevation="0" width="100%">
    <RouterView />
  </var-paper>

  <var-popup v-model:show="accountOpen" position="bottom">
    <var-paper :elevation="3" surface="low">
      <var-cell :title="auth.user?.name ?? 'Admin'" :description="auth.user?.role ?? ''">
        <template #icon><IonIcon name="person-circle-outline" :size="32" color="var(--color-primary)" /></template>
      </var-cell>
      <var-alert v-if="error" type="danger" variant="tonal" :title="error" />
      <var-cell>
        <var-button block type="danger" variant="outlined" :loading="busy" @click="logout">Keluar</var-button>
      </var-cell>
    </var-paper>
  </var-popup>
</template>
