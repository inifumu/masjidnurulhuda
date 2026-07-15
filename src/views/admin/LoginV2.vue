<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, ShieldCheck } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { ApiError } from "@/services/httpClient";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

const authStore = useAuthStore();
const router = useRouter();
const submitError = ref("");
const loginSchema = toTypedSchema(z.object({
  email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi.").min(8, "Password minimal 8 karakter."),
}));
const { handleSubmit, errors, defineField, isSubmitting } = useForm({ validationSchema: loginSchema, initialValues: { email: "", password: "" } });
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");
watch([email, password], () => { submitError.value = ""; });

const handleLogin = handleSubmit(async (values) => {
  submitError.value = "";
  try {
    await authStore.login(values.email, values.password);
    await router.push("/admin/dashboard");
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) submitError.value = "Terlalu banyak percobaan masuk. Tunggu beberapa saat lalu coba kembali.";
    else if (error instanceof ApiError && error.status === 401) submitError.value = "Email atau password tidak sesuai.";
    else submitError.value = "Layanan autentikasi belum dapat dijangkau. Periksa koneksi lalu coba kembali.";
  }
});

onMounted(() => void nextTick(() => document.querySelector<HTMLInputElement>('#login-email')?.focus()));
</script>

<template>
  <main class="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)]">
    <section class="hidden bg-[var(--brand-emerald-deep)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div class="flex items-center gap-3"><img src="/logo.png" alt="" class="size-11 object-contain" /><span class="font-semibold">Masjid Nurul Huda</span></div>
      <div class="max-w-xl"><p class="text-xs font-semibold uppercase tracking-[0.08em] text-brand-accent">Ruang kerja pengurus</p><h1 class="mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em]">Kelola amanah masjid dengan alur yang jelas.</h1><p class="mt-5 max-w-lg text-base leading-7 text-white/75">Akses keuangan, proposal, media, dan pengaturan sesuai peran akun Anda.</p></div>
      <p class="text-xs text-white/55">Sesi dilindungi dan perubahan akses merevoke sesi lama.</p>
    </section>

    <section class="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
      <div class="w-full max-w-md">
        <div class="mb-8 lg:hidden"><div class="flex items-center gap-3"><img src="/logo.png" alt="" class="size-10 object-contain" /><span class="font-semibold">Masjid Nurul Huda</span></div></div>
        <div class="border-y bg-card py-8 sm:border sm:p-8">
          <ShieldCheck class="size-6 text-brand-green" aria-hidden="true" />
          <h1 class="mt-4 text-3xl font-semibold tracking-tight">Masuk ke ruang admin</h1>
          <p class="mt-3 text-sm leading-6 text-muted-foreground">Gunakan akun pengurus yang telah disediakan. Tidak ada kredensial default universal.</p>
          <form class="mt-8 space-y-5" @submit.prevent="handleLogin">
            <FormField label="Email" :error="errors.email" required id="login-email"><template #control="slotProps"><Input v-model="email" v-bind="emailAttrs" :id="slotProps.id" type="email" autocomplete="username" :required="slotProps.required" :aria-required="slotProps.required" :aria-invalid="slotProps.invalid" :aria-describedby="slotProps.describedby" placeholder="nama@domain.com" /></template></FormField>
            <FormField label="Password" :error="errors.password" required id="login-password"><template #control="slotProps"><Input v-model="password" v-bind="passwordAttrs" :id="slotProps.id" type="password" autocomplete="current-password" :required="slotProps.required" :aria-required="slotProps.required" :aria-invalid="slotProps.invalid" :aria-describedby="slotProps.describedby" /></template></FormField>
            <p v-if="submitError" role="alert" class="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">{{ submitError }}</p>
            <Button type="submit" class="w-full" :disabled="isSubmitting">{{ isSubmitting ? "Memverifikasi..." : "Masuk" }}</Button>
          </form>
          <Button variant="ghost" class="mt-5 w-full" @click="router.push('/')"><ArrowLeft class="size-4" aria-hidden="true" />Kembali ke web publik</Button>
        </div>
      </div>
    </section>
  </main>
</template>
