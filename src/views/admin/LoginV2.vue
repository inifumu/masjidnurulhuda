<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/services/httpClient';
const auth = useAuthStore();
const email = ref(''); const password = ref(''); const busy = ref(false); const error = ref('');
const emailInput = ref<HTMLInputElement>();
onMounted(() => emailInput.value?.focus());
async function login() {
  if (busy.value) return;
  busy.value = true; error.value = '';
  try {
    await auth.login(email.value, password.value);
    window.location.assign('/admin/dashboard');
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) error.value = 'Terlalu banyak percobaan masuk. Tunggu lalu coba kembali.';
    else if (e instanceof ApiError && e.status === 401) error.value = 'Email atau password tidak sesuai.';
    else error.value = 'Layanan autentikasi belum dapat dijangkau. Coba kembali.';
  } finally { busy.value = false; }
}
</script>
<template>
  <main>
    <h1>Masuk admin Masjid Nurul Huda</h1>
    <form @submit.prevent="login">
      <fieldset :disabled="busy"><legend>Akun pengurus</legend>
        <p><label for="login-email">Email</label><br><input id="login-email" ref="emailInput" v-model="email" type="email" autocomplete="username" required></p>
        <p><label for="login-password">Password</label><br><input id="login-password" v-model="password" type="password" autocomplete="current-password" required></p>
        <button type="submit">{{ busy ? 'Memproses…' : 'Masuk' }}</button>
      </fieldset>
      <p v-if="error" role="alert">{{ error }}</p>
    </form>
    <p><a href="/">Kembali ke website</a></p>
  </main>
</template>
