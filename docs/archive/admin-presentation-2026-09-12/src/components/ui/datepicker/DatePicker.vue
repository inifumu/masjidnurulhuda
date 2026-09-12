<script setup lang="ts">
import type { DateValue } from "reka-ui";
import { computed, ref, shallowRef, watch } from "vue";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import { parseDate } from "@internationalized/date";
import { Button } from "../button";
import { Calendar } from "../calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

import type { HTMLAttributes } from "vue";

const props = defineProps<{
  id?: string;
  modelValue: string | null;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedby?: string;
  labelledby?: string;
  class?: HTMLAttributes["class"];
  size?: "default" | "sm";
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
      <Button
        :id="id"
        type="button"
        variant="outline"
        :size="props.size"
        :disabled="disabled"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedby"
        :aria-labelledby="labelledby"
        class="w-full justify-start px-3 font-normal"
        :class="[
          !dateValue && 'text-muted-foreground',
          props.class,
        ]"
      >
        <CalendarIcon class="mr-2 size-4 shrink-0" aria-hidden="true" />
        {{ formattedDate }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="z-[100] w-auto p-0" align="start">
      <Calendar :model-value="dateValue" @update:model-value="handleCalendarUpdate" />
    </PopoverContent>
  </Popover>
</template>
