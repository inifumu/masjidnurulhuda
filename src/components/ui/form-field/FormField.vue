<script setup lang="ts">
import { computed, useId } from "vue";

const props = defineProps<{
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  id?: string;
}>();

const generatedId = useId();
const controlId = computed(() => props.id ?? `field-${generatedId}`);
const descriptionId = computed(() => `${controlId.value}-description`);
const errorId = computed(() => `${controlId.value}-error`);
const ariaDescribedby = computed(() => {
  const ids = [];
  if (props.description) ids.push(descriptionId.value);
  if (props.error) ids.push(errorId.value);
  return ids.length ? ids.join(" ") : undefined;
});
</script>

<template>
  <div class="space-y-2">
    <label :for="controlId" class="text-sm font-semibold text-foreground">
      {{ label }}
      <span v-if="required" class="text-destructive" aria-hidden="true">*</span>
      <span v-if="required" class="sr-only">(wajib)</span>
    </label>
    <p v-if="description" :id="descriptionId" class="text-sm text-muted-foreground">{{ description }}</p>
    <slot
      name="control"
      :id="controlId"
      :describedby="ariaDescribedby"
      :invalid="Boolean(error)"
      :required="required"
    />
    <p v-if="error" :id="errorId" role="alert" class="text-sm text-destructive">{{ error }}</p>
  </div>
</template>
