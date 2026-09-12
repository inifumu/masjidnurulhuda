<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { cn } from "@/lib/utils";
import { formatInputRupiah, parseInputRupiah } from "@/utils/currency";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  modelValue?: string | number;
  invalid?: boolean;
  describedby?: string;
  labelledby?: string;
  class?: string;
}>();
const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "change:value", value: number): void;
}>();
const attrs = useAttrs();

const displayValue = computed(() => formatInputRupiah(props.modelValue ?? ""));

const updateValue = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const formatted = formatInputRupiah(input.value);
  input.value = formatted;
  emit("update:modelValue", formatted);
  emit("change:value", parseInputRupiah(formatted));
};
</script>

<template>
  <div
    :class="cn(
      'flex min-h-11 w-full overflow-hidden rounded-sm border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
      invalid && 'border-destructive ring-2 ring-destructive/20',
      props.class,
    )"
  >
    <span class="flex min-h-11 items-center border-r bg-muted px-3 text-sm font-semibold text-muted-foreground" aria-hidden="true">Rp</span>
    <input
      v-bind="attrs"
      :value="displayValue"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedby"
      :aria-labelledby="labelledby"
      class="font-tabular min-h-11 min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 md:text-sm"
      @input="updateValue"
    />
  </div>
</template>
