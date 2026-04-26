<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { AlertTriangle, CheckCircle, Trash2 } from "lucide-vue-next";

const props = defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  type?: "danger" | "warning" | "success";
  confirmText?: string;
}>();

const emit = defineEmits(["close", "confirm"]);
</script>

<template>
  <TransitionRoot as="template" :show="isOpen">
    <Dialog as="div" class="relative z-[100]" @close="emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />
      </TransitionChild>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div
          class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="relative transform overflow-hidden rounded-xl bg-white dark:bg-[#1e293b] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm border border-slate-200 dark:border-slate-700"
            >
              <div class="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div
                    :class="[
                      'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10',
                      type === 'danger'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20'
                        : type === 'success'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20'
                          : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20',
                    ]"
                  >
                    <Trash2 v-if="type === 'danger'" :size="20" />
                    <CheckCircle v-else-if="type === 'success'" :size="20" />
                    <AlertTriangle v-else :size="20" />
                  </div>

                  <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <DialogTitle
                      as="h3"
                      class="text-base font-semibold leading-6 text-slate-900 dark:text-white"
                    >
                      {{ title }}
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-slate-500 dark:text-slate-400">
                        {{ message }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="bg-slate-50 dark:bg-[#121826] px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100 dark:border-slate-800"
              >
                <button
                  type="button"
                  :class="[
                    'inline-flex w-full justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-colors',
                    type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : type === 'success'
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : 'bg-amber-600 hover:bg-amber-500',
                  ]"
                  @click="emit('confirm')"
                >
                  {{ confirmText || "Konfirmasi" }}
                </button>
                <button
                  type="button"
                  class="mt-3 inline-flex w-full justify-center rounded-lg bg-white dark:bg-[#1e293b] px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 sm:mt-0 sm:w-auto transition-colors"
                  @click="emit('close')"
                >
                  Batal
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
