<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/services/httpClient";
import { useAuthStore } from "@/stores/authStore";
import logoTransUrl from "@/assets/logo-trans.png";

const auth = useAuthStore();
const email = ref("");
const password = ref("");
const busy = ref(false);
const error = ref("");

onMounted(() => document.getElementById("login-email")?.focus());

async function login() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await auth.login(email.value, password.value);
    window.location.assign("/admin/dashboard");
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) error.value = "Terlalu banyak percobaan masuk. Tunggu lalu coba kembali.";
    else if (e instanceof ApiError && e.status === 401) error.value = "Email atau password tidak sesuai.";
    else error.value = "Layanan autentikasi belum dapat dijangkau. Coba kembali.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main data-login-workspace class="grid min-h-dvh place-items-center bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
    <Card data-login-surface class="w-full max-w-5xl gap-0 overflow-hidden py-0 shadow-none lg:grid lg:min-h-[36rem] lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
      <section data-login-context class="relative hidden min-w-0 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-12" aria-labelledby="login-context-title">
        <div class="relative z-10 flex items-center gap-3">
          <img :src="logoTransUrl" alt="" class="size-12 object-contain">
          <div>
            <p class="text-base font-semibold tracking-tight">Masjid Nurul Huda</p>
            <p class="mt-1 text-sm text-sidebar-foreground/80">Administrasi pengurus</p>
          </div>
        </div>

        <div class="relative z-10 max-w-lg py-12">
          <h2 id="login-context-title" class="text-balance text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">Kelola pekerjaan masjid sesuai peran.</h2>
          <p class="mt-5 max-w-md text-base leading-7 text-sidebar-foreground/80">Masuk untuk melanjutkan pekerjaan yang tersedia bagi akun Anda.</p>
        </div>

        <div class="relative z-10 max-w-md border-t border-sidebar-foreground/25 pt-5">
          <div class="mb-4 h-1 w-12 rounded-full bg-secondary" aria-hidden="true"></div>
          <p class="text-sm leading-6 text-sidebar-foreground/85">Akses dan tindakan sensitif mengikuti otorisasi server serta jejak audit.</p>
        </div>
      </section>

      <section class="flex min-w-0 items-center bg-card p-6 sm:p-10 lg:p-12">
        <div class="mx-auto grid w-full max-w-sm gap-8">
          <div data-login-mobile-brand class="flex items-center gap-3 lg:hidden">
            <img :src="logoTransUrl" alt="" class="size-11 object-contain">
            <div>
              <p class="text-base font-semibold tracking-tight">Masjid Nurul Huda</p>
              <p class="mt-1 text-sm text-muted-foreground">Administrasi pengurus</p>
            </div>
          </div>

          <div>
            <h1 id="login-title" class="text-3xl font-semibold tracking-tight">Masuk admin</h1>
            <p class="mt-3 text-base leading-7 text-muted-foreground">Gunakan akun pengurus yang aktif.</p>
          </div>

          <form data-login-form @submit.prevent="login">
            <fieldset :disabled="busy">
              <legend class="sr-only">Akun pengurus</legend>
              <FieldGroup>
                <Field>
                  <FieldLabel for="login-email">Email</FieldLabel>
                  <Input id="login-email" v-model="email" type="email" autocomplete="username" required />
                </Field>
                <Field>
                  <FieldLabel for="login-password">Password</FieldLabel>
                  <Input id="login-password" v-model="password" type="password" autocomplete="current-password" required />
                </Field>
                <Button type="submit" class="w-full">{{ busy ? "Memproses…" : "Masuk" }}</Button>
              </FieldGroup>
            </fieldset>
            <p v-if="error" role="alert" class="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-6 text-foreground">{{ error }}</p>
          </form>

          <div class="border-t border-border pt-6">
            <Button variant="outline" as-child class="w-full"><a href="/">Kembali ke website</a></Button>
          </div>
        </div>
      </section>
    </Card>
  </main>
</template>
