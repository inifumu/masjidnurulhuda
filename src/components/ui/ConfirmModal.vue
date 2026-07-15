<script setup lang="ts">
import { AlertTriangle, CheckCircle, Trash2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const props = defineProps<{ isOpen: boolean; title: string; message: string; type?: "danger" | "warning" | "success"; confirmText?: string; pending?: boolean }>();
const emit = defineEmits<{ close: []; confirm: [] }>();
const handleOpen = (open: boolean) => { if (!open && !props.pending) emit("close"); };
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpen">
    <DialogContent :show-close-button="false" class="sm:max-w-sm" @escape-key-down="pending && $event.preventDefault()" @pointer-down-outside="pending && $event.preventDefault()" @interact-outside="pending && $event.preventDefault()">
      <DialogHeader>
        <div class="flex items-start gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full" :class="type === 'danger' ? 'bg-destructive/10 text-destructive' : type === 'success' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'">
            <Trash2 v-if="type === 'danger'" class="size-5" aria-hidden="true" />
            <CheckCircle v-else-if="type === 'success'" class="size-5" aria-hidden="true" />
            <AlertTriangle v-else class="size-5" aria-hidden="true" />
          </span>
          <div><DialogTitle>{{ title }}</DialogTitle><DialogDescription class="mt-2">{{ message }}</DialogDescription></div>
        </div>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" :disabled="pending" @click="emit('close')">Batal</Button>
        <Button :variant="type === 'danger' ? 'destructive' : 'default'" :disabled="pending" :aria-busy="pending" @click="emit('confirm')">{{ pending ? "Memproses..." : confirmText || "Konfirmasi" }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
