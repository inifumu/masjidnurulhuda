<script setup lang="ts">
import { Lock } from "lucide-vue-next";
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-10">
      <h2 class="text-3xl font-bold text-brand-green dark:text-brand-green">
        Kritik & Saran
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mt-3 font-medium">
        Masukan Anda sangat berharga untuk perbaikan pelayanan kami terhadap
        umat.
      </p>
    </div>

    <div class="relative">
      <div
        class="absolute inset-0 z-20 flex items-center justify-center bg-white/5 dark:bg-slate-900/5 backdrop-blur-[2px] rounded-3xl"
      >
        <div
          class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-2xl text-center max-w-[280px] -rotate-1"
        >
          <div
            class="w-12 h-12 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <Lock :size="24" />
          </div>
          <h3
            class="text-lg font-extrabold text-slate-800 dark:text-white mb-1"
          >
            Fitur Terkunci
          </h3>
          <p
            class="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed"
          >
            Sistem aspirasi sedang dalam tahap integrasi database.
          </p>
          <div
            class="inline-block px-3 py-1 bg-brand-green/10 text-brand-green text-[9px] font-bold uppercase rounded-full"
          >
            Coming Soon V2
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-[#121826] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 opacity-20 pointer-events-none select-none"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="h-10 bg-slate-50 dark:bg-slate-900 rounded-xl"></div>
          <div class="h-10 bg-slate-50 dark:bg-slate-900 rounded-xl"></div>
        </div>
        <div class="h-28 bg-slate-50 dark:bg-slate-900 rounded-xl mb-8"></div>
        <div class="h-10 bg-brand-green/30 rounded-xl w-32"></div>
      </div>
    </div>
  </div>
</template>
