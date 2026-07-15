<script setup lang="ts">
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-vue-next";
import { useKasSummary } from "../../../composables/public/home/useKasSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/data-state";

const { kasSummary, isLoadingKas, errorMessage, hasLoadedKas, formatRupiah, loadKas } = useKasSummary();
const metrics = [
  { key: "total_saldo", label: "Saldo aktif", icon: Wallet },
  { key: "pemasukan_bulan_ini", label: "Pemasukan bulan ini", icon: ArrowDownLeft },
  { key: "pengeluaran_bulan_ini", label: "Pengeluaran bulan ini", icon: ArrowUpRight },
] as const;
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="grid gap-10 py-16 md:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)] md:py-24">
      <header>
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-brand-green">Transparansi publik</p>
        <h2 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Ringkasan kas yang dapat diperiksa.</h2>
        <p class="mt-4 max-w-md text-base leading-7 text-muted-foreground">Angka berasal dari transaksi berstatus disetujui. Ringkasan bulan mengikuti periode bisnis Asia/Jakarta.</p>
      </header>
      <div>
        <div v-if="isLoadingKas" class="divide-y border-y"><div v-for="index in 3" :key="index" class="py-5"><Skeleton class="h-3 w-36" /><Skeleton class="mt-3 h-8 w-48" /></div></div>
        <ErrorState v-else-if="errorMessage && !hasLoadedKas" title="Ringkasan kas belum tersedia" :description="errorMessage" @retry="loadKas" />
        <dl v-else class="divide-y border-y">
          <div v-for="metric in metrics" :key="metric.key" class="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <dt class="flex items-center gap-2 text-sm font-medium text-muted-foreground"><component :is="metric.icon" class="size-4 text-brand-green" aria-hidden="true" />{{ metric.label }}</dt>
            <dd class="font-tabular text-2xl font-semibold tracking-tight sm:text-3xl">{{ formatRupiah(kasSummary[metric.key]) }}</dd>
          </div>
        </dl>
        <p v-if="hasLoadedKas" class="mt-4 text-xs leading-5 text-muted-foreground">Nilai nol berarti belum ada transaksi approved pada kategori/periode terkait, bukan estimasi.</p>
      </div>
    </div>
  </div>
</template>
