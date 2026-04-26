<script setup lang="ts">
import { ChevronRight, ImageIcon, Timer } from "lucide-vue-next";
</script>

<template>
  <div>
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4"
    >
      <div>
        <h2 class="text-3xl font-bold text-slate-800 dark:text-white">
          Galeri & Dokumentasi
        </h2>
        <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Rekam jejak visual kegiatan dan pembangunan masjid.
        </p>
      </div>
      <a
        href="#"
        class="inline-flex items-center gap-1 text-sm font-bold text-brand-green hover:text-brand-green/80 transition-colors group"
      >
        Lihat Semua Album
        <ChevronRight
          :size="16"
          class="group-hover:translate-x-1 transition-transform"
        />
      </a>
    </div>

    <div class="relative">
      <div
        class="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/10 dark:bg-slate-900/10 backdrop-blur-[4px] rounded-3xl"
      >
        <div
          class="bg-brand-green text-white px-8 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform cursor-default"
        >
          <Timer :size="18" />
          <span class="font-bold uppercase tracking-widest text-xs"
            >Dalam Pengembangan</span
          >
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-20">
        <div
          v-for="i in 4"
          :key="'img-' + i"
          class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center"
        >
          <ImageIcon :size="48" class="text-slate-300 dark:text-slate-600" />
        </div>
      </div>
    </div>
  </div>
</template>
