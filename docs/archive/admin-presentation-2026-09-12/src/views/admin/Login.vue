<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../../stores/authStore";
import { useRouter } from "vue-router";
import { Mail, Lock, ArrowLeft } from "lucide-vue-next";

const email = ref("");
const password = ref("");
const errorMsg = ref("");

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  errorMsg.value = "";
  const success = await authStore.login(email.value, password.value);
  if (success) router.push("/admin/dashboard");
  else errorMsg.value = "Email atau password salah!";
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0e131f] transition-colors duration-300 font-sans"
  >
    <div
      class="p-8 bg-white dark:bg-[#121826] rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm mx-4 shadow-sm"
    >
      <div class="flex justify-center mb-6">
        <img
          src="/logo.png"
          alt="Logo Masjid"
          class="h-36 w-auto object-contain drop-shadow-sm"
        />
      </div>

      <div class="text-center mb-8">
        <h2 class="text-lg font-semibold text-brand-green">Sistem Manajemen</h2>
        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Masuk ke dashboard Nurul Huda
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label
            class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >Email</label
          >
          <div
            class="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#0e131f] focus-within:border-brand-green dark:focus-within:border-brand-green focus-within:ring-0 transition-colors overflow-hidden"
          >
            <div
              class="px-4 py-2.5 text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800"
            >
              <Mail :size="16" :stroke-width="1.5" />
            </div>
            <input
              v-model="email"
              type="email"
              required
              class="flex-1 px-3 py-2.5 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-0 w-full"
              placeholder="admin@domain.com"
            />
          </div>
        </div>

        <div>
          <label
            class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >Password</label
          >
          <div
            class="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#0e131f] focus-within:border-brand-green dark:focus-within:border-brand-green focus-within:ring-0 transition-colors overflow-hidden"
          >
            <div
              class="px-4 py-2.5 text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800"
            >
              <Lock :size="16" :stroke-width="1.5" />
            </div>
            <input
              v-model="password"
              type="password"
              required
              class="flex-1 px-3 py-2.5 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-0 w-full"
              placeholder="••••••••"
            />
          </div>
          <p v-if="errorMsg" class="text-red-500 text-xs mt-1.5">
            {{ errorMsg }}
          </p>
        </div>

        <button
          type="submit"
          class="w-full py-2.5 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-green/90 transition-colors duration-300 mt-2"
        >
          Masuk
        </button>
      </form>

      <div
        class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center"
      >
        <button
          @click="$router.push('/')"
          class="inline-flex items-center gap-1.5 text-xs text-brand-accent hover:opacity-80 transition-opacity"
        >
          <ArrowLeft :size="14" :stroke-width="1.5" />
          Kembali ke web publik
        </button>
      </div>
    </div>
  </div>
</template>
