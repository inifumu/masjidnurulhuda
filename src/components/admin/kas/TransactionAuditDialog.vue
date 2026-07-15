<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { Dialog, DialogDescription, DialogPanel, DialogTitle, TransitionRoot } from "@headlessui/vue";
import type { TransactionAuditTimeline } from "../../../services/admin/kasService";

const props = defineProps<{
  open: boolean;
  mode: "void" | "reject" | "timeline";
  reason?: string;
  pending?: boolean;
  timeline?: TransactionAuditTimeline | null;
  error?: string;
}>();
const emit = defineEmits<{
  close: [];
  confirm: [];
  retry: [];
  "update:reason": [value: string];
}>();
const reasonInput = ref<HTMLTextAreaElement | null>(null);
watch(() => props.open, async (open) => {
  if (open && props.mode !== "timeline") {
    await nextTick();
    reasonInput.value?.focus();
  }
});
const labels: Record<string, string> = {
  created: "Transaksi langsung dibuat", submitted: "Proposal diajukan",
  approved_ketua: "Disetujui Ketua", approved_bendahara: "Dicairkan Bendahara",
  rejected: "Proposal ditolak", voided: "Transaksi dibatalkan",
};
</script>

<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-[130]" @close="pending ? undefined : emit('close')">
      <div class="fixed inset-0 bg-slate-950/60" aria-hidden="true" />
      <div class="fixed inset-0 overflow-y-auto p-4">
        <div class="flex min-h-full items-center justify-center">
          <DialogPanel class="w-full max-w-lg rounded-xl border bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            <DialogTitle class="text-lg font-semibold">
              {{ mode === "timeline" ? "Riwayat audit transaksi" : mode === "void" ? "Batalkan transaksi?" : "Tolak proposal?" }}
            </DialogTitle>
            <DialogDescription class="mt-2 text-sm text-slate-500">
              {{ mode === "timeline" ? "Catatan transisi status yang tersimpan oleh sistem." : "Alasan wajib 10–500 karakter dan akan disimpan dalam audit trail." }}
            </DialogDescription>

            <template v-if="mode !== 'timeline'">
              <label for="audit-reason" class="mt-4 block text-sm font-medium">Alasan</label>
              <textarea id="audit-reason" ref="reasonInput" :value="reason" rows="4" maxlength="500"
                :aria-invalid="!!reason && reason.trim().length < 10" aria-describedby="audit-reason-help"
                class="mt-2 w-full rounded-md border p-3 text-sm focus:ring-2 focus:ring-brand-green dark:border-slate-700 dark:bg-slate-900"
                @input="emit('update:reason', ($event.target as HTMLTextAreaElement).value)" />
              <p id="audit-reason-help" class="mt-1 text-xs text-slate-500">{{ reason?.trim().length || 0 }}/500 karakter; minimal 10.</p>
            </template>

            <template v-else>
              <p v-if="error" role="alert" class="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{{ error }} <button class="ml-2 underline" @click="emit('retry')">Coba lagi</button></p>
              <p v-else-if="!timeline" class="mt-4 text-sm text-slate-500" role="status">Memuat riwayat…</p>
              <p v-else-if="!timeline.history_available" class="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">Riwayat sebelum audit trail tidak tersedia</p>
              <ol v-else class="mt-4 space-y-4 border-l pl-5">
                <li v-for="event in timeline.events" :key="event.id" class="relative">
                  <span class="absolute -left-[25px] top-1 h-2 w-2 rounded-full bg-brand-green" />
                  <p class="font-medium">{{ labels[event.event_type] || event.event_type }}</p>
                  <p class="text-xs text-slate-500">{{ event.created_at }} · {{ event.actor_name || `Pengguna #${event.actor_id}` }}</p>
                  <p v-if="event.reason" class="mt-1 text-sm">Alasan: {{ event.reason }}</p>
                </li>
              </ol>
            </template>

            <div class="mt-5 flex justify-end gap-2">
              <button type="button" class="rounded-md border px-4 py-2 text-sm" :disabled="pending" @click="emit('close')">{{ mode === "timeline" ? "Tutup" : "Batal" }}</button>
              <button v-if="mode !== 'timeline'" type="button" class="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                :disabled="pending || !reason || reason.trim().length < 10 || reason.trim().length > 500" @click="emit('confirm')">
                {{ pending ? "Memproses…" : mode === "void" ? "Batalkan transaksi" : "Tolak proposal" }}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
