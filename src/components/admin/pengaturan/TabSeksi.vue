<script setup lang="ts">
import { Edit2, Trash2 } from "lucide-vue-next";

defineProps<{ data: any[]; isLoading: boolean }>();
defineEmits(["edit", "delete"]);
</script>

<template>
  <div
    class="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-lg"
  >
    <table class="w-full text-left border-collapse">
      <thead
        class="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider"
      >
        <tr>
          <th class="py-3 px-4 w-16 text-center">ID</th>
          <th class="py-3 px-4">Nama Seksi</th>
          <th class="py-3 px-4">Susunan Pengurus</th>
          <th class="py-3 px-4 w-24 text-center">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        <tr v-if="isLoading" class="text-center">
          <td colspan="4" class="py-8 text-slate-400 text-sm">
            Memuat data...
          </td>
        </tr>
        <template v-else>
          <tr
            v-for="item in data"
            :key="item.id"
            class="text-sm group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td class="py-3 px-4 text-center text-slate-400 font-mono text-xs">
              {{ item.id }}
            </td>
            <td
              class="py-3 px-4 font-medium text-slate-700 dark:text-slate-200"
            >
              {{ item.nama_seksi }}
            </td>
            <td class="py-3 px-4 text-slate-500">
              <div class="flex flex-wrap gap-1.5">
                <span v-if="!item.nama_pengurus">-</span>
                <span
                  v-for="(p, idx) in item.nama_pengurus
                    ? item.nama_pengurus.split(', ')
                    : []"
                  :key="idx"
                  class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[11px]"
                >
                  {{ p }}
                </span>
              </div>
            </td>
            <td class="py-3 px-4 text-center">
              <div
                class="flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity"
              >
                <button
                  @click="$emit('edit', item)"
                  class="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded transition-colors"
                >
                  <Edit2 :size="16" />
                </button>
                <button
                  @click="$emit('delete', item.id)"
                  class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="data.length === 0">
            <td
              colspan="4"
              class="py-12 text-center text-slate-400 text-sm italic"
            >
              Belum ada data.
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
