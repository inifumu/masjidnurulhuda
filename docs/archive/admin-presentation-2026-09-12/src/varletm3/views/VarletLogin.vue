<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Snackbar } from '@varlet/ui'
import { useAuthStore } from '@/stores/authStore'
import IonIcon from '../components/IonIcon.vue'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin(valid: boolean) {
  if (!valid || loading.value) return
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    await router.replace('/varletm3/dashboard')
  } catch (cause: unknown) {
    error.value = cause instanceof Error ? cause.message : 'Login gagal'
    Snackbar.error(error.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-stage">
    <var-paper class="login-panel" :elevation="2" variant="filled">
      <var-cell>
        <var-space direction="column" align="center" size="small">
          <IonIcon name="business-outline" :size="48" color="var(--color-primary)" />
          <strong>Masjid Nurul Huda</strong>
          <span>Panel administrasi</span>
        </var-space>
      </var-cell>

      <var-divider />

      <var-cell>
        <var-form @submit="handleLogin">
          <var-space direction="column" size="large">
            <var-input
              v-model="email"
              type="email"
              variant="outlined"
              placeholder="Email"
              aria-label="Email"
              :rules="[(value) => !!value || 'Email wajib diisi']"
              :disabled="loading"
            >
              <template #prepend-icon><IonIcon name="mail-outline" /></template>
            </var-input>

            <var-input
              v-model="password"
              type="password"
              variant="outlined"
              placeholder="Password"
              aria-label="Password"
              :rules="[(value) => !!value || 'Password wajib diisi']"
              :disabled="loading"
            >
              <template #prepend-icon><IonIcon name="lock-closed-outline" /></template>
            </var-input>

            <var-alert v-if="error" type="danger" variant="tonal" :title="error" />

            <var-button block type="primary" native-type="submit" :loading="loading" :disabled="loading">
              Masuk
            </var-button>

            <var-button block text type="primary" tag="a" href="/">
              Kembali ke website
            </var-button>
          </var-space>
        </var-form>
      </var-cell>
    </var-paper>
  </main>
</template>

<style scoped>
.login-stage {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 16px;
  background: var(--color-background);
  box-sizing: border-box;
}

.login-panel {
  width: min(100%, 400px);
}
</style>
