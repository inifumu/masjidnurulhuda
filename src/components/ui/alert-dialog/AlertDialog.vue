<script setup lang="ts">
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from "reka-ui";
import { Button } from "@/components/ui/button";

const props = defineProps<{ open: boolean; title: string; description: string; confirmText?: string; pending?: boolean }>();
const emit = defineEmits<{ close: []; confirm: [] }>();
const handleOpen = (open: boolean) => { if (!open && !props.pending) emit("close"); };
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="handleOpen">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-50 bg-foreground/55" />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none"
        @escape-key-down="pending && $event.preventDefault()"
        @pointer-down-outside="pending && $event.preventDefault()"
        @interact-outside="pending && $event.preventDefault()"
      >
        <div>
          <AlertDialogTitle class="font-semibold">{{ title }}</AlertDialogTitle>
          <AlertDialogDescription class="mt-2 text-sm text-muted-foreground">{{ description }}</AlertDialogDescription>
        </div>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel as-child><Button variant="outline" :disabled="pending">Batal</Button></AlertDialogCancel>
          <AlertDialogAction as-child><Button variant="destructive" :disabled="pending" @click="emit('confirm')">{{ pending ? "Memproses…" : confirmText ?? "Konfirmasi" }}</Button></AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
