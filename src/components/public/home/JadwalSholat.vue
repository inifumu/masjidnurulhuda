<script setup lang="ts">
import { Clock3, RefreshCw } from "lucide-vue-next";
import { useJadwal } from "../../../composables/public/home/useJadwal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/data-state";

const { jadwal, lokasiMasjid, isLoading, errorMessage, source, loadJadwal } = useJadwal();
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="grid gap-8 border-b border-border py-12 md:grid-cols-[minmax(13rem,0.65fr)_minmax(0,1.35fr)] md:py-16">
      <header>
        <div class="flex items-center gap-2 text-brand-green"><Clock3 class="size-5" aria-hidden="true" /><p class="text-sm font-semibold">Waktu salat hari ini</p></div>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight">Jadwal Salat</h2>
        <p v-if="lokasiMasjid" class="mt-2 text-sm text-muted-foreground">{{ lokasiMasjid }} dan sekitarnya</p>
        <p v-if="source === 'cache'" class="mt-3 text-xs text-muted-foreground">Dimuat dari cache hari ini.</p>
        <p v-else-if="source === 'stale'" class="mt-3 text-xs font-medium text-warning">Data cache lama — konfirmasi waktu sebelum berangkat.</p>
      </header>

      <div>
        <div v-if="isLoading" class="grid grid-cols-2 gap-px border-y bg-border sm:grid-cols-5" aria-label="Memuat jadwal salat">
          <div v-for="index in 5" :key="index" class="bg-background px-3 py-5"><Skeleton class="h-3 w-14" /><Skeleton class="mt-3 h-7 w-16" /></div>
        </div>
        <ErrorState v-else-if="source === 'unavailable'" title="Jadwal belum tersedia" :description="errorMessage" @retry="loadJadwal" />
        <template v-else>
          <div class="grid grid-cols-2 gap-px border-y bg-border sm:grid-cols-5">
            <div v-for="waktu in jadwal" :key="waktu.nama" class="bg-background px-3 py-5 last:col-span-2 sm:last:col-span-1">
              <p class="text-xs font-semibold text-muted-foreground">{{ waktu.nama }}</p>
              <p class="font-tabular mt-2 text-2xl font-semibold tracking-tight">{{ waktu.waktu }}</p>
            </div>
          </div>
          <div v-if="source === 'stale'" class="mt-4 flex flex-wrap items-center justify-between gap-3 border-l-2 border-warning bg-warning-soft px-4 py-3 text-sm text-warning">
            <p>{{ errorMessage }}</p><Button variant="outline" size="sm" @click="loadJadwal"><RefreshCw class="size-4" /> Coba perbarui</Button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
