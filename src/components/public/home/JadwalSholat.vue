<script setup lang="ts">
import { Clock } from "lucide-vue-next";
import { useJadwal } from "../../../composables/public/home/useJadwal";

// Logic dipanggil dari Layer 2 secara bersih
const { jadwal, lokasiMasjid } = useJadwal();
</script>

<template>
  <div
    class="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-2xl transition-shadow duration-500"
  >
    <div class="flex items-center gap-3 text-slate-800 dark:text-white">
      <Clock class="text-brand-green animate-bounce" :size="24" />
      <div>
        <h3 class="font-bold leading-tight">Jadwal Sholat</h3>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {{ lokasiMasjid }} & Sekitarnya
        </p>
      </div>
    </div>
    <div class="flex flex-wrap justify-center gap-3 md:gap-8 w-full md:w-auto">
      <div
        v-for="waktu in jadwal"
        :key="waktu.nama"
        class="text-center px-4 py-2 rounded-xl hover:bg-brand-green/5 dark:hover:bg-slate-800 transition-colors cursor-default group"
      >
        <p
          class="text-[11px] font-bold text-slate-400 group-hover:text-brand-green transition-colors uppercase tracking-widest"
        >
          {{ waktu.nama }}
        </p>
        <p class="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
          {{ waktu.waktu }}
        </p>
      </div>
    </div>
  </div>
</template>
