<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import {
  FileText,
  ShieldCheck,
  Plus,
  ClipboardList,
  Wallet,
} from "lucide-vue-next";
import { useKas } from "../../composables/admin/useKas";
import { useAuthStore } from "../../stores/authStore"; // 🟢 Import Auth Store

import KasLaporan from "../../components/admin/kas/KasLaporan.vue";
import KasApproval from "../../components/admin/kas/KasApproval.vue";
import KasInput from "../../components/admin/kas/KasInput.vue";
import KasProposal from "../../components/admin/kas/KasProposal.vue";

const {
  activeTab,
  pendingTransactions,
  loadData,
  closeDropdowns,
  formatRupiah,
  globalSaldoAwal,
  globalMasuk,
  globalKeluar,
  globalSaldoAkhir,
} = useKas();

const authStore = useAuthStore(); // 🟢 Panggil Store

onMounted(() => {
  loadData();
  document.addEventListener("click", closeDropdowns);
});
onUnmounted(() => document.removeEventListener("click", closeDropdowns));
</script>

<template>
  <div class="space-y-6 pb-20 max-w-7xl mx-auto">
    <div>
      <h2 class="text-xl font-semibold text-slate-800 dark:text-white">
        Manajemen Keuangan
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Sistem Arus Kas Masjid Nurul Huda.
      </p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="p-4 rounded-xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm"
      >
        <span
          class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2"
          >Saldo Awal Bulan Ini</span
        >
        <div
          class="text-lg font-bold text-slate-700 dark:text-slate-300 truncate"
        >
          {{ formatRupiah(globalSaldoAwal) }}
        </div>
      </div>
      <div
        class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex flex-col justify-between shadow-sm"
      >
        <span
          class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2"
          >Pemasukan Bulan Ini</span
        >
        <div
          class="text-lg font-bold text-emerald-700 dark:text-emerald-500 truncate"
        >
          + {{ formatRupiah(globalMasuk) }}
        </div>
      </div>
      <div
        class="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex flex-col justify-between shadow-sm"
      >
        <span
          class="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2"
          >Pengeluaran Bulan Ini</span
        >
        <div
          class="text-lg font-bold text-rose-700 dark:text-rose-500 truncate"
        >
          - {{ formatRupiah(globalKeluar) }}
        </div>
      </div>
      <div
        class="p-4 rounded-xl bg-brand-green text-white border border-brand-green/20 flex flex-col justify-between shadow-lg shadow-brand-green/20"
      >
        <div class="flex items-center justify-between mb-2">
          <span
            class="text-[10px] font-bold text-emerald-100 uppercase tracking-wider"
            >Sisa Saldo Kas Aktif</span
          >
          <Wallet :size="14" class="text-emerald-100" />
        </div>
        <div class="text-xl font-bold truncate">
          {{ formatRupiah(globalSaldoAkhir) }}
        </div>
      </div>
    </div>

    <div
      class="bg-white dark:bg-[#121826] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-2"
    >
      <div
        class="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-t-xl hide-scrollbar"
      >
        <button
          @click="activeTab = 'laporan'"
          :class="
            activeTab === 'laporan'
              ? 'border-brand-green text-brand-green bg-white dark:bg-[#121826]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          "
          class="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <FileText :size="18" /> Rincian Transaksi
        </button>

        <button
          @click="activeTab = 'approval'"
          :class="
            activeTab === 'approval'
              ? 'border-brand-green text-brand-green bg-white dark:bg-[#121826]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          "
          class="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <ShieldCheck :size="18" />
          {{
            authStore.user?.role === "pengurus" ? "Status Proposal" : "Approval"
          }}
          <span
            v-if="pendingTransactions.length > 0"
            class="ml-1.5 px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full leading-none font-bold"
          >
            {{ pendingTransactions.length }}
          </span>
        </button>

        <button
          v-if="authStore.user?.role !== 'pengurus'"
          @click="activeTab = 'input'"
          :class="
            activeTab === 'input'
              ? 'border-brand-green text-brand-green bg-white dark:bg-[#121826]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          "
          class="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Plus :size="18" /> Kas Baru
        </button>

        <button
          v-if="authStore.user?.role !== 'ketua'"
          @click="activeTab = 'proposal'"
          :class="
            activeTab === 'proposal'
              ? 'border-brand-green text-brand-green bg-white dark:bg-[#121826]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          "
          class="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <ClipboardList :size="18" /> Proposal
        </button>
      </div>

      <div class="p-5 md:p-6">
        <KasLaporan v-if="activeTab === 'laporan'" />
        <KasApproval v-else-if="activeTab === 'approval'" />
        <KasInput v-else-if="activeTab === 'input'" />
        <KasProposal v-else-if="activeTab === 'proposal'" />
      </div>
    </div>
  </div>
</template>

<style>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
