<!--
  Tujuan: Shadow view Dashboard V2 untuk redesign UI bertahap tanpa mengubah kontrak data/route backend.
  Caller: src/router/index.ts (route admin dashboard setelah controlled swap Stage 4).
  Dependensi: src/stores/authStore, src/composables/admin/useDashboard, src/components/admin/shared/MonthYearPicker, lucide-vue-next.
  Main Functions: render ringkasan kas periodik (saldo, pemasukan, pengeluaran) dengan period picker dan loading parity.
  Side Effects: Memicu fetch summary melalui useDashboard saat mount dan saat periode diganti.
-->
<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useDashboard } from "@/composables/admin/useDashboard";
import MonthYearPicker from "@/components/admin/shared/MonthYearPicker.vue";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-vue-next";

const authStore = useAuthStore();
const { summary, selectedPeriod, isLoading, updatePeriod } = useDashboard();

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
};
</script>

<template>
  <section class="space-y-6">
    <header
      class="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-xl px-5 py-4 shadow-sm dark:border-slate-800/60 dark:bg-[#09090b]/60 sm:px-6"
    >
      <div
        class="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-brand-green/15 blur-3xl dark:bg-brand-green/20"
      />
      <div
        class="pointer-events-none absolute -right-16 -bottom-20 h-56 w-56 rounded-full bg-brand-accent/15 blur-3xl dark:bg-brand-accent/20"
      />

      <div
        class="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
          >
            Dashboard Keuangan
          </p>
          <h2
            class="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Selamat Datang, {{ authStore.user?.name }}
          </h2>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Ringkasan kas Masjid Nurul Huda berdasarkan periode aktif.
          </p>
        </div>

        <MonthYearPicker
          :model-value="selectedPeriod"
          :disabled="isLoading"
          @update:model-value="updatePeriod"
        />
      </div>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <!-- Card: Saldo Kas -->
      <article
        class="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:border-brand-accent/30 dark:border-slate-800/60 dark:bg-[#09090b]/60 dark:hover:border-brand-accent/40 hover:shadow-md flex flex-col justify-between h-full"
      >
        <div class="flex items-start justify-between pb-4">
          <p class="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">
            Saldo Kas Saat Ini
          </p>
          <div class="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shrink-0 ml-2">
            <Wallet :size="18" :stroke-width="2" class="antialiased" style="shape-rendering: geometricPrecision;" />
          </div>
        </div>

        <div>
          <div
            v-if="isLoading"
            class="h-8 w-3/4 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
          ></div>
          <h3
            v-else
            class="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 truncate"
            :title="formatRupiah(summary.saldoAkhir)"
          >
            {{ formatRupiah(summary.saldoAkhir) }}
          </h3>
          <p class="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
            Net Position
          </p>
        </div>
      </article>

      <!-- Card: Pemasukan -->
      <article
        class="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:border-emerald-500/30 dark:border-slate-800/60 dark:bg-[#09090b]/60 dark:hover:border-emerald-500/30 hover:shadow-md flex flex-col justify-between h-full"
      >
        <div class="flex items-start justify-between pb-4">
          <p class="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">
            Total Pemasukan
          </p>
          <div class="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 shrink-0 ml-2">
            <TrendingUp :size="18" :stroke-width="2" class="antialiased" style="shape-rendering: geometricPrecision;" />
          </div>
        </div>

        <div>
          <div
            v-if="isLoading"
            class="h-8 w-3/4 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
          ></div>
          <h3
            v-else
            class="text-2xl md:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 truncate"
            :title="formatRupiah(summary.totalPemasukan)"
          >
            {{ formatRupiah(summary.totalPemasukan) }}
          </h3>
          <p class="text-[11px] font-medium text-emerald-600/70 dark:text-emerald-500/70 mt-1 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight :size="12" /> Arus Masuk
          </p>
        </div>
      </article>

      <!-- Card: Pengeluaran -->
      <article
        class="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-white/60 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:border-rose-500/30 dark:border-slate-800/60 dark:bg-[#09090b]/60 dark:hover:border-rose-500/30 hover:shadow-md flex flex-col justify-between h-full sm:col-span-2 xl:col-span-1"
      >
        <div class="flex items-start justify-between pb-4">
          <p class="text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">
            Total Pengeluaran
          </p>
          <div class="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 shrink-0 ml-2">
            <TrendingDown :size="18" :stroke-width="2" class="antialiased" style="shape-rendering: geometricPrecision;" />
          </div>
        </div>

        <div>
          <div
            v-if="isLoading"
            class="h-8 w-3/4 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
          ></div>
          <h3
            v-else
            class="text-2xl md:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400 truncate"
            :title="formatRupiah(summary.totalPengeluaran)"
          >
            {{ formatRupiah(summary.totalPengeluaran) }}
          </h3>
          <p class="text-[11px] font-medium text-rose-600/70 dark:text-rose-500/70 mt-1 uppercase tracking-wider flex items-center gap-1">
            <ArrowDownRight :size="12" /> Arus Keluar
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
