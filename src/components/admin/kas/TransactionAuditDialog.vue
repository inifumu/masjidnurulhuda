<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TransactionAuditTimeline } from "../../../services/admin/kasService";

const props = defineProps<{ open: boolean; mode: "void" | "reject" | "timeline"; reason?: string; pending?: boolean; timeline?: TransactionAuditTimeline | null; error?: string }>();
const emit = defineEmits<{ close: []; confirm: []; retry: []; "update:reason": [value: string] }>();
const reasonInput = ref<HTMLTextAreaElement | null>(null);
watch(() => props.open, async (open) => { if (open && props.mode !== "timeline") { await nextTick(); reasonInput.value?.focus(); } });
const handleOpen = (open: boolean) => { if (!open && !props.pending) emit("close"); };
const labels: Record<string, string> = { created: "Transaksi langsung dibuat", submitted: "Proposal diajukan", approved_ketua: "Disetujui Ketua", approved_bendahara: "Dicairkan Bendahara", rejected: "Proposal ditolak", voided: "Transaksi dibatalkan" };
</script>

<template>
  <Dialog :open="open" @update:open="handleOpen">
    <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg" :show-close-button="!pending" @escape-key-down="pending && $event.preventDefault()" @pointer-down-outside="pending && $event.preventDefault()" @interact-outside="pending && $event.preventDefault()">
      <DialogHeader><DialogTitle>{{ mode === "timeline" ? "Riwayat audit transaksi" : mode === "void" ? "Batalkan transaksi?" : "Tolak proposal?" }}</DialogTitle><DialogDescription>{{ mode === "timeline" ? "Catatan transisi status yang tersimpan oleh sistem." : "Alasan wajib 10–500 karakter dan akan disimpan dalam audit trail." }}</DialogDescription></DialogHeader>
      <template v-if="mode !== 'timeline'">
        <label for="audit-reason" class="text-sm font-semibold">Alasan</label>
        <textarea id="audit-reason" ref="reasonInput" :value="reason" rows="4" maxlength="500" :aria-invalid="!!reason && reason.trim().length < 10" aria-describedby="audit-reason-help" class="min-h-28 w-full rounded-sm border border-input bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 aria-invalid:border-destructive" @input="emit('update:reason', ($event.target as HTMLTextAreaElement).value)" />
        <p id="audit-reason-help" class="text-xs text-muted-foreground">{{ reason?.trim().length || 0 }}/500 karakter; minimal 10.</p>
      </template>
      <template v-else>
        <p v-if="error" role="alert" class="border-l-2 border-destructive px-3 py-2 text-sm">{{ error }} <Button variant="link" class="h-auto px-1" @click="emit('retry')">Coba lagi</Button></p>
        <p v-else-if="!timeline" class="text-sm text-muted-foreground" role="status">Memuat riwayat…</p>
        <p v-else-if="!timeline.history_available" class="border-l-2 border-warning px-3 py-2 text-sm">Riwayat sebelum audit trail tidak tersedia</p>
        <ol v-else class="space-y-4 border-l pl-5"><li v-for="event in timeline.events" :key="event.id" class="relative"><span class="absolute -left-[25px] top-1 size-2 rounded-full bg-primary" aria-hidden="true" /><p class="font-semibold">{{ labels[event.event_type] || event.event_type }}</p><p class="text-xs text-muted-foreground">{{ event.created_at }} · {{ event.actor_name || `Pengguna #${event.actor_id}` }}</p><p v-if="event.reason" class="mt-1 text-sm">Alasan: {{ event.reason }}</p></li></ol>
      </template>
      <DialogFooter><Button variant="outline" :disabled="pending" @click="emit('close')">{{ mode === "timeline" ? "Tutup" : "Batal" }}</Button><Button v-if="mode !== 'timeline'" variant="destructive" :disabled="pending || !reason || reason.trim().length < 10 || reason.trim().length > 500" @click="emit('confirm')">{{ pending ? "Memproses…" : mode === "void" ? "Batalkan transaksi" : "Tolak proposal" }}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
</template>
