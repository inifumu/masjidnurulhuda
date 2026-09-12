<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Eye, FileCheck2, LoaderCircle, Send } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useKas } from "@/composables/admin/useKas";
import { ApiError } from "@/services/httpClient";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/datepicker/DatePicker.vue";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const {
  formProposal,
  filteredCategoriesProposal,
  sections,
  methods,
  isLoading,
  handleProposal,
  formatRupiah,
  formatInputRupiah,
  parseInputRupiah,
} = useKas();

type FieldName = "kategori" | "seksi" | "jumlah" | "tanggal" | "keperluan" | "keterangan";
type ValidationErrors = Record<FieldName, string>;
type FocusTarget = HTMLElement | { $el?: HTMLElement } | null;
const validationOrder: FieldName[] = ["keperluan", "jumlah", "keterangan", "kategori", "tanggal", "seksi"];

const flowOptions = [
  { value: "pengeluaran", label: "Minta Dana", caption: "Kebutuhan dana yang menunggu pencairan", icon: ArrowDownRight, activeClass: "border-destructive bg-destructive text-white dark:!bg-destructive dark:text-white", idleClass: "border-border bg-card hover:border-destructive/35 hover:bg-destructive/5" },
  { value: "pemasukan", label: "Lapor Setoran", caption: "Setoran yang tetap melalui persetujuan", icon: ArrowUpRight, activeClass: "border-primary bg-primary text-primary-foreground", idleClass: "border-border bg-card hover:border-primary/35 hover:bg-secondary/70" },
] as const;

const emptyErrors = (): ValidationErrors => ({ kategori: "", seksi: "", jumlah: "", tanggal: "", keperluan: "", keterangan: "" });
const validationErrors = ref(emptyErrors());
const isConfirmDialogOpen = ref(false);
const submitError = ref("");
const amountInput = ref<HTMLInputElement | null>(null);
const purposeInput = ref<HTMLInputElement | null>(null);
const descriptionInput = ref<HTMLTextAreaElement | null>(null);
const dateTrigger = ref<FocusTarget>(null);
const categoryTrigger = ref<FocusTarget>(null);
const sectionTrigger = ref<FocusTarget>(null);
const submitButton = ref<FocusTarget>(null);

const selectedCategory = computed(() => filteredCategoriesProposal.value.find((item) => item.id === formProposal.value.kategori_id));
const selectedSection = computed(() => sections.value.find((item) => item.id === formProposal.value.seksi_id));
const selectedMethod = computed(() => methods.value.find((item) => item.id === formProposal.value.metode));
const reviewAmount = computed(() => formProposal.value.jumlah ? formatRupiah(parseInputRupiah(formProposal.value.jumlah)) : "Rp0");
const reviewDate = computed(() => {
  if (!formProposal.value.tanggal) return "Tanggal belum dipilih";
  const date = new Date(`${formProposal.value.tanggal}T00:00:00`);
  return Number.isNaN(date.getTime()) ? formProposal.value.tanggal : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
});

const resolveElement = (target: FocusTarget) => target instanceof HTMLElement ? target : target?.$el ?? null;
const clearError = (field: FieldName) => { validationErrors.value[field] = ""; submitError.value = ""; };
const validate = () => {
  const errors = emptyErrors();
  const nominal = parseInputRupiah(formProposal.value.jumlah);
  if (!Number.isFinite(nominal) || nominal <= 0) errors.jumlah = "Masukkan estimasi nominal lebih dari Rp0.";
  if (formProposal.value.keperluan.trim().length < 5 || formProposal.value.keperluan.trim().length > 120) errors.keperluan = "Keperluan wajib diisi 5–120 karakter.";
  if (formProposal.value.keterangan.trim().length < 10 || formProposal.value.keterangan.trim().length > 2000) errors.keterangan = "Rincian pengajuan wajib diisi 10–2000 karakter.";
  if (!formProposal.value.tanggal) errors.tanggal = "Pilih tanggal kegiatan.";
  if (!formProposal.value.kategori_id) errors.kategori = "Pilih kategori pengajuan.";
  if (!formProposal.value.seksi_id) errors.seksi = "Pilih seksi pengaju.";
  validationErrors.value = errors;
  return !Object.values(errors).some(Boolean);
};
const focusFirstError = async () => {
  await nextTick();
  const first = validationOrder.find((field) => validationErrors.value[field]);
  const targets = { keperluan: purposeInput.value, keterangan: descriptionInput.value, jumlah: amountInput.value, kategori: categoryTrigger.value, tanggal: dateTrigger.value, seksi: sectionTrigger.value };
  resolveElement(targets[first ?? "jumlah"])?.focus();
};
const submitForm = async () => {
  submitError.value = "";
  if (!validate()) { await focusFirstError(); toast.error("Periksa kembali kolom yang ditandai."); return; }
  toast.dismiss();
  isConfirmDialogOpen.value = true;
};
const closeConfirmDialog = async () => {
  if (isLoading.value) return;
  isConfirmDialogOpen.value = false;
  await nextTick();
  resolveElement(submitButton.value)?.focus();
};
const executeSubmit = async () => {
  if (isLoading.value) return;
  try {
    await handleProposal();
    isConfirmDialogOpen.value = false;
    validationErrors.value = emptyErrors();
    submitError.value = "";
    await nextTick();
    resolveElement(purposeInput.value)?.focus();
    toast.success("Proposal berhasil diajukan dan menunggu persetujuan ketua.");
  } catch (error: unknown) {
    isConfirmDialogOpen.value = false;
    if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
      validationErrors.value.kategori = error.fields.kategori_id ?? "";
      validationErrors.value.seksi = error.fields.seksi_id ?? "";
      validationErrors.value.jumlah = error.fields.jumlah ?? "";
      validationErrors.value.tanggal = error.fields.tanggal ?? "";
      validationErrors.value.keperluan = error.fields.keperluan ?? "";
      validationErrors.value.keterangan = error.fields.keterangan ?? "";
      await focusFirstError();
    } else {
      await nextTick();
      resolveElement(submitButton.value)?.focus();
    }
    const conflictMessage = "Permintaan berbenturan dengan proses lain. Data belum digandakan; coba lagi.";
    submitError.value = error instanceof ApiError && error.status === 409
      ? conflictMessage
      : error instanceof Error ? error.message : "Proposal belum dapat diajukan. Coba lagi dengan data yang sama.";
    toast.error(submitError.value);
  }
};
</script>

<template>
  <section class="space-y-5" data-proposal-request-brief>
    <Dialog :open="isConfirmDialogOpen" @update:open="(open) => { if (!open && !isLoading) closeConfirmDialog(); }">
      <DialogContent :show-close-button="false" class="grid max-h-[calc(100dvh-2rem)] max-w-[44rem] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-4 sm:p-5" @escape-key-down="isLoading && $event.preventDefault()" @pointer-down-outside="isLoading && $event.preventDefault()" @interact-outside="isLoading && $event.preventDefault()">
        <DialogHeader><DialogTitle>Ajukan Proposal?</DialogTitle><DialogDescription>Periksa kebutuhan dan jalur persetujuan sebelum proposal dikirim.</DialogDescription></DialogHeader>
        <div class="min-h-0 overflow-y-auto overscroll-contain px-0.5">
          <div class="border-b border-dashed pb-4"><p class="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Ringkasan pengajuan</p><h3 class="mt-2 break-words text-xl font-semibold leading-snug">{{ formProposal.keperluan }}</h3><p class="mt-3 text-[2rem] font-semibold tracking-tight tabular-nums">{{ reviewAmount }}</p></div>
          <dl class="grid grid-cols-2 gap-x-5 gap-y-4 bg-muted/20 p-4">
            <div v-for="item in [{ label: 'Arus', value: formProposal.tipe === 'pengeluaran' ? 'Minta dana' : 'Lapor setoran' }, { label: 'Kategori', value: selectedCategory?.nama_kategori }, { label: 'Tanggal', value: reviewDate }, { label: 'Metode', value: selectedMethod?.name }, { label: 'Seksi', value: selectedSection?.nama_seksi }]" :key="item.label" class="min-w-0"><dt class="text-xs text-muted-foreground">{{ item.label }}</dt><dd class="mt-1 break-words text-sm font-semibold">{{ item.value || '—' }}</dd></div>
          </dl>
          <div class="border-b border-dashed py-4"><p class="text-xs uppercase tracking-[0.12em] text-muted-foreground">Rincian wajib</p><p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{{ formProposal.keterangan }}</p></div>
          <div class="py-4 text-sm leading-6 text-muted-foreground"><FileCheck2 class="mr-2 inline size-4 text-primary" />Menunggu persetujuan ketua → Menunggu pencairan bendahara → Disetujui.</div>
        </div>
        <DialogFooter class="gap-2"><Button variant="outline" class="min-h-11 xl:h-8 xl:min-h-8" :disabled="isLoading" @click="closeConfirmDialog">Batal</Button><Button class="min-h-11 xl:h-8 xl:min-h-8" :disabled="isLoading" :aria-busy="isLoading" @click="executeSubmit"><LoaderCircle v-if="isLoading" class="size-4 animate-spin" /><Send v-else class="size-4" />{{ isLoading ? "Memproses..." : "Ya, Ajukan" }}</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <form class="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.7fr)] xl:items-start" novalidate @submit.prevent="submitForm">
      <section data-request-brief-main class="min-w-0 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div data-field="keperluan">
          <FormField label="Keperluan" control-gap="comfortable" required :error="validationErrors.keperluan">
            <template #control="field"><Input :id="field.id" ref="purposeInput" v-model="formProposal.keperluan" maxlength="120" placeholder="Contoh: Konsumsi rapat pengurus" :aria-invalid="field.invalid || undefined" :aria-describedby="field.describedby" class="h-11 text-base font-semibold xl:h-8" @input="clearError('keperluan')" /></template>
          </FormField>
        </div>

        <div data-field="arus" class="mt-5">
          <FormField label="Arus pengajuan" required>
          <template #control>
            <fieldset :disabled="isLoading" class="grid min-w-0 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Arus pengajuan">
              <legend class="sr-only">Pilih arus pengajuan</legend>
              <label v-for="option in flowOptions" :key="option.value" class="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 xl:h-8 xl:min-h-8" :class="formProposal.tipe === option.value ? option.activeClass : option.idleClass">
                <input v-model="formProposal.tipe" class="sr-only" type="radio" :value="option.value" :aria-label="option.label">
                <component :is="option.icon" class="size-4 shrink-0" />
                <span class="min-w-0 flex-1 text-sm font-semibold">{{ option.label }}</span>
              </label>
            </fieldset>
          </template>
          </FormField>
        </div>

        <div data-field="jumlah" class="mt-5">
          <FormField label="Estimasi nominal" required :error="validationErrors.jumlah">
            <template #control="field"><div class="flex h-11 items-center rounded-md border border-input bg-background px-3 shadow-xs transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 xl:h-8" :class="field.invalid && 'border-destructive'"><span class="mr-2 text-sm font-semibold text-muted-foreground">Rp</span><input :id="field.id" ref="amountInput" :value="formProposal.jumlah" inputmode="numeric" autocomplete="off" placeholder="0" :aria-invalid="field.invalid || undefined" :aria-describedby="field.describedby" class="min-w-0 flex-1 bg-transparent text-lg font-semibold tabular-nums outline-none placeholder:text-muted-foreground xl:text-sm" @input="formProposal.jumlah = formatInputRupiah(($event.target as HTMLInputElement).value); clearError('jumlah')"></div></template>
          </FormField>
        </div>

        <div data-field="keterangan" class="mt-5">
          <FormField label="Rincian pengajuan" control-gap="comfortable" description="Jelaskan penerima manfaat, ruang lingkup, dan dasar estimasi." required :error="validationErrors.keterangan">
            <template #control="field"><Textarea :id="field.id" ref="descriptionInput" v-model="formProposal.keterangan" rows="10" maxlength="2000" placeholder="Jelaskan secara lengkap kebutuhan dana atau setoran ini." :invalid="field.invalid" :describedby="field.describedby" class="min-h-52" @input="clearError('keterangan')" /></template>
          </FormField>
        </div>

      </section>

      <aside data-request-brief-metadata class="grid min-w-0 gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-2 sm:p-5 xl:grid-cols-1">
        <div data-field="kategori"><FormField label="Kategori" required :error="validationErrors.kategori"><template #control="field"><DropdownMenu><DropdownMenuTrigger as-child><Button :id="field.id" ref="categoryTrigger" type="button" variant="outline" class="h-11 w-full justify-between px-3 font-normal xl:h-8" :aria-invalid="field.invalid || undefined" :aria-describedby="field.describedby" :aria-labelledby="field.labelledby"><span class="truncate" :class="!selectedCategory && 'text-muted-foreground'">{{ selectedCategory?.nama_kategori ?? "Pilih kategori" }}</span><ChevronDown class="size-4 shrink-0 text-muted-foreground" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" class="max-w-[calc(100vw-2rem)]"><DropdownMenuRadioGroup :model-value="formProposal.kategori_id ? String(formProposal.kategori_id) : ''" @update:model-value="(value) => { formProposal.kategori_id = Number(value); clearError('kategori'); }"><DropdownMenuRadioItem v-for="category in filteredCategoriesProposal" :key="category.id" :value="String(category.id)" class="h-11 max-w-[24rem] px-2 pr-8 xl:h-8">{{ category.nama_kategori }}</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu></template></FormField></div>

        <div data-field="tanggal"><FormField label="Tanggal kegiatan" required :error="validationErrors.tanggal"><template #control="field"><DatePicker :id="field.id" ref="dateTrigger" v-model="formProposal.tanggal" :invalid="field.invalid" :describedby="field.describedby" :labelledby="field.labelledby" placeholder="Pilih tanggal" class="xl:h-8 xl:min-h-8" @update:model-value="clearError('tanggal')" /></template></FormField></div>

        <div data-field="metode"><FormField label="Metode" required><template #control="field"><DropdownMenu><DropdownMenuTrigger as-child><Button :id="field.id" type="button" variant="outline" class="h-11 w-full justify-between px-3 font-normal xl:h-8" :aria-labelledby="field.labelledby"><span class="truncate">{{ selectedMethod?.name ?? "Pilih metode" }}</span><ChevronDown class="size-4 shrink-0 text-muted-foreground" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuRadioGroup :model-value="formProposal.metode" @update:model-value="(value) => { if (typeof value === 'string') formProposal.metode = value; }"><DropdownMenuRadioItem v-for="method in methods" :key="method.id" :value="method.id" class="h-11 px-2 pr-8 xl:h-8">{{ method.name }}</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu></template></FormField></div>

        <div data-field="seksi" class="sm:col-span-2 xl:col-span-1"><FormField label="Seksi pengaju" required :error="validationErrors.seksi"><template #control="field"><DropdownMenu><DropdownMenuTrigger as-child><Button :id="field.id" ref="sectionTrigger" type="button" variant="outline" class="h-11 w-full justify-between px-3 font-normal xl:h-8" :aria-invalid="field.invalid || undefined" :aria-describedby="field.describedby" :aria-labelledby="field.labelledby"><span class="truncate" :class="!selectedSection && 'text-muted-foreground'">{{ selectedSection?.nama_seksi ?? "Pilih seksi" }}</span><ChevronDown class="size-4 shrink-0 text-muted-foreground" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" class="!w-[min(32rem,calc(100vw-2rem))]"><DropdownMenuRadioGroup class="grid grid-cols-2" :model-value="formProposal.seksi_id ? String(formProposal.seksi_id) : ''" @update:model-value="(value) => { formProposal.seksi_id = Number(value); clearError('seksi'); }"><DropdownMenuRadioItem v-for="section in sections" :key="section.id" :value="String(section.id)" class="h-11 min-w-0 whitespace-nowrap px-2 pr-8 xl:h-8">{{ section.nama_seksi }}</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu></template></FormField></div>

        <footer data-proposal-completion class="grid gap-3 border-t pt-4 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center xl:col-span-1 xl:grid-cols-1">
          <div>
            <p class="text-xs leading-5 text-muted-foreground">Dikirim oleh {{ selectedSection?.nama_seksi ?? "seksi pengaju" }} · Menunggu persetujuan ketua, lalu Menunggu pencairan bendahara.</p>
            <p v-if="submitError" role="alert" class="mt-3 border-l-2 border-destructive bg-destructive/5 px-3 py-3 text-sm leading-6 text-destructive">{{ submitError }} Semua input tetap dipertahankan untuk percobaan berikutnya.</p>
          </div>
          <Button ref="submitButton" type="submit" class="min-h-11 w-full sm:w-auto xl:h-8 xl:min-h-8 xl:w-full" :disabled="isLoading" :aria-busy="isLoading"><LoaderCircle v-if="isLoading" class="size-4 animate-spin" /><Eye v-else class="size-4" />{{ isLoading ? "Mengajukan…" : "Review pengajuan" }}</Button>
        </footer>
      </aside>
    </form>
  </section>
</template>
