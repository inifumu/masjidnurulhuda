<script setup lang="ts">
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from "reka-ui";
import { Check, ChevronsUpDown } from "lucide-vue-next";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<{
  modelValue?: string;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedby?: string;
  labelledby?: string;
}>(), {
  placeholder: "Pilih opsi",
  searchPlaceholder: "Cari opsi…",
  emptyText: "Tidak ada hasil.",
});
const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const labelFor = (value: unknown) => props.options.find((option) => option.value === value)?.label ?? "";
</script>

<template>
  <ComboboxRoot
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  >
    <ComboboxAnchor class="relative">
      <ComboboxInput
        :display-value="labelFor"
        :placeholder="searchPlaceholder || placeholder"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedby"
        :aria-labelledby="labelledby"
        class="min-h-11 w-full rounded-sm border border-input bg-card py-2 pl-3 pr-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
      />
      <ComboboxTrigger class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground" aria-label="Buka pilihan">
        <ChevronsUpDown class="size-4" aria-hidden="true" />
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent class="z-[110] mt-1 max-h-72 min-w-[var(--reka-combobox-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
        <ComboboxViewport class="max-h-60 overflow-y-auto p-1">
          <ComboboxEmpty class="px-3 py-6 text-center text-sm text-muted-foreground">{{ emptyText }}</ComboboxEmpty>
          <ComboboxItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
            class="relative flex min-h-10 cursor-default select-none items-center rounded-sm py-2 pl-3 pr-9 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            {{ option.label }}
            <ComboboxItemIndicator class="absolute right-3"><Check class="size-4" aria-hidden="true" /></ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
