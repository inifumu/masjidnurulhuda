<script setup lang="ts">
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-vue-next";
import { useKasSummary } from "../../../composables/public/home/useKasSummary";

// Logic dipanggil dari Layer 2
const { kasSummary, isLoadingKas, formatRupiah } = useKasSummary();
</script>

<template>
  <div>
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4"
    >
      <div>
        <h2 class="text-3xl font-bold text-slate-800 dark:text-white">
          Transparansi Keuangan
        </h2>
        <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Laporan kas masjid bulan ini yang dikelola oleh takmir.
        </p>
      </div>
      <a
        href="#"
        class="inline-flex items-center gap-1 text-sm font-bold text-brand-green hover:text-brand-green/80 transition-colors group"
      >
        Lihat Laporan Lengkap
        <ChevronRight
          :size="16"
          class="group-hover:translate-x-1 transition-transform"
        />
      </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        class="bg-white dark:bg-[#121826] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
      >
        <div
          class="absolute -right-4 -top-4 w-24 h-24 bg-brand-green/5 rounded-full group-hover:scale-[2.5] transition-transform duration-700"
        ></div>
        <div class="flex justify-between items-start mb-4 relative">
          <span
            class="text-xs font-bold text-slate-400 uppercase tracking-wider"
            >Total Saldo Aktif</span
          >
          <div
            class="p-2.5 bg-brand-green/10 text-brand-green rounded-xl group-hover:scale-110 transition-transform"
          >
            <Wallet :size="20" />
          </div>
        </div>
        <div
          class="text-3xl font-extrabold text-slate-800 dark:text-white relative"
        >
          {{ isLoadingKas ? "..." : formatRupiah(kasSummary.total_saldo) }}
        </div>
        <p class="text-xs font-medium text-slate-500 mt-3 relative">
          Sirkulasi Keuangan Masjid
        </p>
      </div>

      <div
        class="bg-white dark:bg-[#121826] p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
      >
        <div class="flex justify-between items-start mb-4 relative">
          <span
            class="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider"
            >Pemasukan Bulan Ini</span
          >
          <div
            class="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform"
          >
            <TrendingUp :size="20" />
          </div>
        </div>
        <div
          class="text-3xl font-extrabold text-slate-800 dark:text-white relative"
        >
          {{
            isLoadingKas ? "..." : formatRupiah(kasSummary.pemasukan_bulan_ini)
          }}
        </div>
        <p class="text-xs font-medium text-slate-500 mt-3 relative">
          Infaq, sedekah & donasi
        </p>
      </div>

      <div
        class="bg-white dark:bg-[#121826] p-6 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
      >
        <div class="flex justify-between items-start mb-4 relative">
          <span
            class="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider"
            >Pengeluaran Bulan Ini</span
          >
          <div
            class="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl group-hover:scale-110 transition-transform"
          >
            <TrendingDown :size="20" />
          </div>
        </div>
        <div
          class="text-3xl font-extrabold text-slate-800 dark:text-white relative"
        >
          {{
            isLoadingKas
              ? "..."
              : formatRupiah(kasSummary.pengeluaran_bulan_ini)
          }}
        </div>
        <p class="text-xs font-medium text-slate-500 mt-3 relative">
          Operasional & Kegiatan rutin
        </p>
      </div>
    </div>
  </div>
</template>
