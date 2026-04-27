<script setup lang="ts">
import { useAuthStore } from "../../stores/authStore";
import { useDashboard } from "../../composables/admin/useDashboard"; // 🟢 Panggil composable
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-vue-next";

const authStore = useAuthStore();

// 🟢 Ambil state dan data dari composable
const { summary, isLoading } = useDashboard();

// 🟢 UI Logic murni (biarkan di sini)
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-end">
      <div>
        <h2 class="text-xl font-semibold text-slate-800 dark:text-white">
          Selamat Datang, {{ authStore.user?.name }}
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ringkasan keuangan Masjid Nurul Huda hari ini.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        class="bg-white dark:bg-[#121826] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400"
          >
            <Wallet :size="22" />
          </div>
        </div>
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Saldo Kas Saat Ini
        </p>
        <div
          v-if="isLoading"
          class="h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded mt-2 w-3/4"
        ></div>
        <h3
          v-else
          class="text-2xl font-bold text-slate-800 dark:text-white mt-1"
        >
          {{ formatRupiah(summary.saldoAkhir) }}
        </h3>
      </div>

      <div
        class="bg-white dark:bg-[#121826] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400"
          >
            <TrendingUp :size="22" />
          </div>
          <div
            class="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"
          >
            <ArrowUpRight :size="12" class="mr-0.5" /> TOTAL MASUK
          </div>
        </div>
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Total Pemasukan
        </p>
        <div
          v-if="isLoading"
          class="h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded mt-2 w-3/4"
        ></div>
        <h3
          v-else
          class="text-2xl font-bold text-slate-800 dark:text-white mt-1 text-emerald-600"
        >
          {{ formatRupiah(summary.totalPemasukan) }}
        </h3>
      </div>

      <div
        class="bg-white dark:bg-[#121826] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400"
          >
            <TrendingDown :size="22" />
          </div>
          <div
            class="flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full"
          >
            <ArrowDownRight :size="12" class="mr-0.5" /> TOTAL KELUAR
          </div>
        </div>
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Total Pengeluaran
        </p>
        <div
          v-if="isLoading"
          class="h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded mt-2 w-3/4"
        ></div>
        <h3
          v-else
          class="text-2xl font-bold text-slate-800 dark:text-white mt-1 text-rose-600"
        >
          {{ formatRupiah(summary.totalPengeluaran) }}
        </h3>
      </div>
    </div>
  </div>
</template>
