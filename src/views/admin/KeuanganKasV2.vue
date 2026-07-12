<!--
  Tujuan: Shadow view KeuanganKas V2 untuk redesign UI bertahap tanpa mengubah kontrak data/route backend.
  Caller: src/router/index.ts (route admin keuangan setelah controlled swap Stage 4).
  Dependensi: src/components/legacy/KeuanganKasLegacyBridge.vue.
  Main Functions: menjaga parity fitur KeuanganKas dengan delegasi ke bridge legacy selama tahap transisi V2.
  Side Effects: Tidak ada side effect langsung di view; side effect tetap di bridge/composable existing.
-->
<script setup lang="ts">
import KeuanganKasLegacyBridge from "../../components/legacy/KeuanganKasLegacyBridge.vue";
</script>

<template>
  <section class="space-y-6">
    <header
      class="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-[#121826] sm:px-6"
    >
      <div
        class="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-brand-green/10 blur-3xl dark:bg-brand-green/10"
      />
      <div
        class="pointer-events-none absolute -right-16 -bottom-20 h-56 w-56 rounded-full bg-brand-accent/10 blur-3xl dark:bg-brand-accent/10"
      />

      <div
        class="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
          >
            Keuangan Kas
          </p>
          <h2
            class="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Manajemen Arus Kas
          </h2>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Stage transisi V2 aktif dengan kontrak logic yang sama seperti
            legacy.
          </p>
        </div>

        <span
          class="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          Parity Bridge Active
        </span>
      </div>
    </header>

    <KeuanganKasLegacyBridge />
  </section>
</template>
