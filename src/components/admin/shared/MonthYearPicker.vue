<!--
  Tujuan: Wrapper reusable pemilih periode bulan-tahun berbasis primitive shadcn-vue (Button + Popover + Calendar).
  Caller: src/components/legacy/DashboardLegacyBridge.vue (pilot Stage 3 dashboard period filter).
  Dependensi: @internationalized/date, lucide-vue-next, src/components/ui/{button,popover,calendar}.
  Main Functions: sinkronisasi model month/year numerik dengan CalendarDate, emit update saat periode dipilih.
  Side Effects: Menutup popover otomatis setelah seleksi periode baru.
-->
<script setup lang="ts">
import { CalendarDate } from "@internationalized/date";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import type { DateValue } from "reka-ui";
import { computed, ref } from "vue";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";

type MonthYearValue = {
  month: number;
  year: number;
};

const props = withDefaults(
  defineProps<{
    modelValue: MonthYearValue;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: MonthYearValue): void;
}>();

const isOpen = ref(false);

const toCalendarDate = (value: MonthYearValue): DateValue =>
  new CalendarDate(value.year, value.month, 1);

const calendarModelValue = computed<DateValue>(() =>
  toCalendarDate(props.modelValue),
);

const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long" });

const displayLabel = computed(() => {
  const date = new Date(props.modelValue.year, props.modelValue.month - 1, 1);
  const monthText =
    monthLabel.format(date).charAt(0).toUpperCase() +
    monthLabel.format(date).slice(1);
  return `${monthText} ${props.modelValue.year}`;
});

const handleDateUpdate = (nextDate: DateValue | undefined) => {
  if (!nextDate) {
    return;
  }

  emit("update:modelValue", {
    month: nextDate.month,
    year: nextDate.year,
  });

  isOpen.value = false;
};
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        class="min-w-52 justify-start text-left font-normal"
        :disabled="disabled"
        aria-label="Pilih periode bulan dan tahun"
      >
        <CalendarIcon class="mr-2 size-4" />
        <span>{{ displayLabel }}</span>
      </Button>
    </PopoverTrigger>

    <PopoverContent class="w-auto p-0" align="end">
      <Calendar
        :model-value="calendarModelValue"
        layout="month-and-year"
        @update:model-value="handleDateUpdate"
      />
    </PopoverContent>
  </Popover>
</template>
