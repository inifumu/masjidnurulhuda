<script setup lang="ts">
import { ChevronRight, Calendar, Construction } from "lucide-vue-next";
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4"
    >
      <div>
        <h2 class="text-3xl font-bold text-slate-800 dark:text-white">
          Kabar Masjid
        </h2>
        <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Informasi kajian, pengumuman, dan kegiatan terbaru.
        </p>
      </div>
      <a
        href="#"
        class="inline-flex items-center gap-1 text-sm font-bold text-brand-green hover:text-brand-green/80 transition-colors group"
      >
        Indeks Artikel & Berita
        <ChevronRight
          :size="16"
          class="group-hover:translate-x-1 transition-transform"
        />
      </a>
    </div>

    <div class="relative">
      <div
        class="absolute inset-0 z-20 flex items-center justify-center bg-white/5 dark:bg-slate-900/5 backdrop-blur-[3px] rounded-3xl"
      >
        <div
          class="bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-2xl shadow-xl border border-brand-green/20 flex items-center gap-3 animate-pulse"
        >
          <Construction class="text-brand-green" :size="20" />
          <span class="font-bold text-slate-800 dark:text-white text-sm"
            >Segera Hadir</span
          >
        </div>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 grayscale-[0.5]"
      >
        <div
          v-for="i in 3"
          :key="i"
          class="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div class="h-48 bg-slate-200 dark:bg-slate-700"></div>
          <div class="p-6">
            <div
              class="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3"
            >
              <Calendar :size="14" /> <span>-- --- ----</span>
            </div>
            <div
              class="h-5 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mb-3"
            ></div>
            <div class="h-3 bg-slate-50 dark:bg-slate-900 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
