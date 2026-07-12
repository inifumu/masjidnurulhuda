<script setup lang="ts">
/**
 * Tujuan: Halaman login admin V2 dengan validasi form inline berbasis `vee-validate` + `zod`.
 * Caller: Router `/admin/login` (shadow swap dari Login legacy tanpa ubah URL).
 * Dependensi: `useAuthStore`, `vue-router`, `vee-validate`, `@vee-validate/zod`, `zod`, UI `Card/Button`, icon lucide.
 * Main Functions: `handleLogin` (submit ter-guard schema), validasi field `email/password`, redirect ke dashboard saat sukses.
 * Side Effects: Request ke `/api/admin/auth/login` melalui `authStore.login` dan update state error submit-level.
 */
import { nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, Lock, Mail } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const errorMsg = ref("");

const authStore = useAuthStore();
const router = useRouter();

const loginSchema = toTypedSchema(
  z.object({
    email: z
      .string()
      .min(1, "Email wajib diisi.")
      .email("Format email tidak valid."),
    password: z
      .string()
      .min(1, "Password wajib diisi.")
      .min(8, "Password minimal 8 karakter."),
  }),
);

const { handleSubmit, errors, defineField, isSubmitting } = useForm({
  validationSchema: loginSchema,
  initialValues: {
    email: "",
    password: "",
  },
});

const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

watch([email, password], () => {
  if (errorMsg.value) {
    errorMsg.value = "";
  }
});

const handleLogin = handleSubmit(async (values) => {
  errorMsg.value = "";
  const success = await authStore.login(values.email, values.password);

  if (success) {
    await router.push("/admin/dashboard");
    return;
  }

  errorMsg.value = "Email atau password salah!";
});

onMounted(() => {
  // Low-friction entry: memastikan kursor langsung siap di kolom email.
  void nextTick(() => {
    const emailEl = document.querySelector<HTMLInputElement>(
      'input[type="email"]',
    );
    emailEl?.focus();
  });
});
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden bg-[#f4f6fb] font-sans text-slate-800 transition-colors duration-300 dark:bg-[#0b1020] dark:text-slate-100"
  >
    <div
      class="pointer-events-none absolute -left-20 top-[-4rem] h-72 w-72 rounded-full bg-brand-green/20 blur-3xl dark:bg-brand-green/15"
    />
    <div
      class="pointer-events-none absolute -right-16 bottom-[-5rem] h-80 w-80 rounded-full bg-brand-accent/20 blur-3xl dark:bg-brand-accent/10"
    />

    <div
      class="relative mx-auto flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6"
    >
      <Transition name="login-enter" appear>
        <Card
          class="w-full max-w-md rounded-3xl border border-white/70 bg-white/72 shadow-[0_18px_48px_rgba(2,6,23,0.12)] backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/62"
        >
          <CardHeader class="space-y-4 pb-3 pt-7 text-center">
            <div class="flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo Masjid Nurul Huda"
                class="h-16 w-auto object-contain opacity-95"
              />
            </div>

            <div class="space-y-2">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400"
              >
                Sistem Manajemen Masjid
              </p>
              <CardTitle
                class="text-2xl font-semibold leading-snug tracking-tight text-brand-green dark:text-emerald-300 sm:text-3xl"
              >
                Masuk ke Admin Panel
              </CardTitle>
              <CardDescription
                class="mx-auto max-w-[30ch] text-sm leading-relaxed text-slate-600 dark:text-slate-300"
              >
                Kelola kas dan proposal, pemberitahuan, media, serta pengaturan
                website dengan akses terpusat.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent class="pb-7 pt-2">
            <form class="space-y-4" @submit.prevent="handleLogin">
              <div class="space-y-1.5">
                <label
                  class="text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Email
                </label>
                <div
                  class="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white/80 transition-colors focus-within:border-brand-green/80 focus-within:ring-1 focus-within:ring-brand-green/50 dark:border-slate-700 dark:bg-slate-950/70"
                >
                  <div
                    class="px-3.5 py-2.5 text-slate-400 dark:text-slate-500 border-r border-slate-200/80 dark:border-slate-700/90"
                  >
                    <Mail :size="16" :stroke-width="1.7" />
                  </div>
                  <input
                    v-model="email"
                    v-bind="emailAttrs"
                    type="email"
                    autofocus
                    placeholder="admin@domain.com"
                    class="h-11 w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                    :class="
                      errors.email
                        ? 'placeholder:text-rose-400 dark:placeholder:text-rose-400'
                        : ''
                    "
                  />
                </div>
                <p
                  v-if="errors.email"
                  class="text-xs text-rose-600 dark:text-rose-400"
                >
                  {{ errors.email }}
                </p>
              </div>

              <div class="space-y-1.5">
                <label
                  class="text-sm font-medium text-slate-600 dark:text-slate-400"
                >
                  Password
                </label>
                <div
                  class="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white/80 transition-colors focus-within:border-brand-green/80 focus-within:ring-1 focus-within:ring-brand-green/50 dark:border-slate-700 dark:bg-slate-950/70"
                >
                  <div
                    class="px-3.5 py-2.5 text-slate-400 dark:text-slate-500 border-r border-slate-200/80 dark:border-slate-700/90"
                  >
                    <Lock :size="16" :stroke-width="1.7" />
                  </div>
                  <input
                    v-model="password"
                    v-bind="passwordAttrs"
                    type="password"
                    placeholder="••••••••"
                    class="h-11 w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                    :class="
                      errors.password
                        ? 'placeholder:text-rose-400 dark:placeholder:text-rose-400'
                        : ''
                    "
                  />
                </div>
                <p
                  v-if="errors.password"
                  class="text-xs text-rose-600 dark:text-rose-400"
                >
                  {{ errors.password }}
                </p>
                <p v-if="errorMsg" class="text-xs text-destructive">
                  {{ errorMsg }}
                </p>
              </div>

              <Button
                type="submit"
                :disabled="isSubmitting"
                class="cta-pulse h-11 w-full rounded-xl bg-brand-green text-sm font-semibold text-white shadow-[0_8px_18px_rgba(17,107,57,0.32)] transition-all hover:bg-brand-green/95 hover:shadow-[0_10px_22px_rgba(17,107,57,0.36)] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {{ isSubmitting ? "Memproses..." : "Masuk" }}
              </Button>
            </form>

            <div
              class="mt-5 border-t border-slate-200/90 pt-4 text-center dark:border-slate-700/90"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="text-xs text-brand-accent hover:text-brand-accent/80"
                @click="router.push('/')"
              >
                <ArrowLeft :size="14" :stroke-width="1.8" />
                Kembali ke web publik
              </Button>
            </div>
          </CardContent>
        </Card>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
@keyframes ctaPulse {
  0%,
  100% {
    transform: translateZ(0);
    box-shadow: 0 8px 18px rgba(17, 107, 57, 0.3);
  }
  50% {
    transform: translateY(-1px) scale(1.005);
    box-shadow: 0 12px 24px rgba(17, 107, 57, 0.4);
  }
}

.cta-pulse {
  animation: ctaPulse 2.2s ease-in-out infinite;
}

.cta-pulse:hover,
.cta-pulse:active {
  animation-play-state: paused;
}

.login-enter-enter-active {
  transition:
    opacity 0.34s ease,
    transform 0.34s ease;
}

.login-enter-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.login-enter-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
