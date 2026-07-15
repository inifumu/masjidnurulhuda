<script setup lang="ts">
import type { DateValue } from "reka-ui";
import { computed, ref, shallowRef, watch } from "vue";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import { parseDate } from "@internationalized/date";
import { Calendar } from "../calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

const props = defineProps<{
  modelValue: string | null;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedby?: string;
  labelledby?: string;
}>();
const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const parseModelValue = (value: string | null): DateValue | undefined => {
  if (!value) return undefined;
  try {
    return parseDate(value);
  } catch {
    return undefined;
  }
};

const open = ref(false);
const dateValue = shallowRef<DateValue | undefined>(parseModelValue(props.modelValue));

watch(() => props.modelValue, (value) => {
  if (value !== dateValue.value?.toString()) dateValue.value = parseModelValue(value);
});

const handleCalendarUpdate = (value: DateValue | undefined) => {
  if (!value) return;
  dateValue.value = value;
  emit("update:modelValue", value.toString());
  open.value = false;
};

const formattedDate = computed(() => {
  if (!dateValue.value) return props.placeholder ?? "Pilih tanggal";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(dateValue.value.toDate("Asia/Jakarta"));
});
</script>

<template>
  <Popover :open="open" @update:open="open = $event">
    <PopoverTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedby"
        :aria-labelledby="labelledby"
        class="flex min-h-11 w-full items-center justify-start rounded-sm border border-input bg-card px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60"
        :class="!dateValue && 'text-muted-foreground'"
      >
        <CalendarIcon class="mr-2 size-4 shrink-0" aria-hidden="true" />
        {{ formattedDate }}
      </button>
    </PopoverTrigger>
    <PopoverContent class="z-[100] w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md" align="start">
      <Calendar :model-value="dateValue" @update:model-value="handleCalendarUpdate" />
    </PopoverContent>
  </Popover>
</template>
