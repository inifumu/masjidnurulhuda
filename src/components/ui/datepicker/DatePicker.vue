<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { Calendar } from '../calendar'
import { parseDate } from '@internationalized/date'

const props = defineProps<{
  modelValue: string | null
  placeholder?: string
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const dateValue = ref<unknown>(
  props.modelValue ? parseDate(props.modelValue) : undefined
)

const toDateString = (value: unknown): string | null => {
  if (value && typeof (value as { toString?: unknown }).toString === 'function') {
    return (value as { toString: () => string }).toString()
  }
  return null
}

const handleCalendarUpdate = (value: unknown) => {
  dateValue.value = value
}

watch(dateValue, (newDate) => {
  const nextValue = toDateString(newDate)
  if (nextValue) {
    emits('update:modelValue', nextValue)
  }
})

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    dateValue.value = undefined
  } else if (newVal !== toDateString(dateValue.value)) {
    try {
      dateValue.value = parseDate(newVal)
    } catch {
      // ignore invalid dates
    }
  }
})

const formattedDate = computed(() => {
  if (!dateValue.value) return props.placeholder || 'Pilih tanggal'
  const value = dateValue.value as { toDate?: (tz: string) => Date }
  try {
    if (typeof value.toDate === 'function') {
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(value.toDate('Asia/Jakarta'))
    }
  } catch {
    // ignore format fallback
  }
  return toDateString(dateValue.value) || (props.placeholder || 'Pilih tanggal')
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        type="button"
        :class="[
          'flex h-9 w-full items-center justify-start rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-1 focus:ring-brand-green',
          !dateValue && 'text-slate-500'
        ]"
      >
        <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
        {{ formattedDate }}
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0 z-[100] bg-white dark:bg-[#09090b] border-slate-200 dark:border-slate-800 rounded-xl shadow-md" align="start">
      <Calendar
        :model-value="dateValue as any"
        @update:model-value="handleCalendarUpdate"
      />
    </PopoverContent>
  </Popover>
</template>
