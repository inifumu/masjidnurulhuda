<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Eye,
  LoaderCircle,
  Save,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useKas } from "@/composables/admin/useKas";
import { ApiError } from "@/services/httpClient";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DatePicker from "@/components/ui/datepicker/DatePicker.vue";
import DirectCashSlip from "./DirectCashSlip.vue";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

const {
  formInput,
  filteredCategoriesInput,
  sections,
  isLoading,
  handleDirectInput,
  formatRupiah,
  formatInputRupiah,
  parseInputRupiah,
} = useKas();

type FieldName = "kategori" | "jumlah" | "tanggal" | "keperluan" | "keterangan";
type ValidationErrors = Record<FieldName, string>;
type FocusTarget = HTMLElement | { $el?: HTMLElement } | null;
const validationOrder: FieldName[] = ["jumlah", "keperluan", "tanggal", "kategori", "keterangan"];

const flowOptions = [
  {
    value: "pemasukan",
    label: "Pemasukan",
    slipLabel: "Pemasukan kas",
    caption: "Infak, donasi, setoran, penerimaan",
    icon: ArrowUpRight,
    activeClass: "border-primary bg-primary text-primary-foreground",
    idleClass: "border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary/70",
    emphasisClass: "text-success",
  },
  {
    value: "pengeluaran",
    label: "Pengeluaran",
    slipLabel: "Pengeluaran kas",
    caption: "Belanja dan pembayaran operasional",
    icon: ArrowDownRight,
    activeClass: "border-destructive bg-destructive text-white dark:!bg-destructive dark:text-white dark:hover:!bg-destructive/90",
    idleClass: "border-border bg-card text-foreground hover:border-destructive/35 hover:bg-destructive/5 dark:hover:bg-destructive/10",
    emphasisClass: "text-destructive",
  },
] as const;

const emptyErrors = (): ValidationErrors => ({
  kategori: "",
  jumlah: "",
  tanggal: "",
  keperluan: "",
  keterangan: "",
});

const validationErrors = ref(emptyErrors());
const isConfirmDialogOpen = ref(false);
const secondaryOpen = ref(false);
const submitError = ref("");
const categoryTrigger = ref<FocusTarget>(null);
const amountInput = ref<HTMLInputElement | null>(null);
const purposeInput = ref<HTMLInputElement | null>(null);
const dateTrigger = ref<FocusTarget>(null);
const descriptionInput = ref<HTMLTextAreaElement | null>(null);
const submitButton = ref<FocusTarget>(null);

const selectedCategory = computed(() =>
  filteredCategoriesInput.value.find((item) => item.id === formInput.value.kategori_id),
);
const selectedSection = computed(() =>
  sections.value.find((item) => item.id === formInput.value.seksi_id),
);
const activeFlow = computed(
  () => flowOptions.find((item) => item.value === formInput.value.tipe) ?? flowOptions[0],
);
const flowLabel = computed(() => activeFlow.value.slipLabel);
const reviewTitle = computed(() => formInput.value.keperluan || "Belum diisi");
const reviewAmount = computed(() =>
  formInput.value.jumlah ? formatRupiah(parseInputRupiah(formInput.value.jumlah)) : "Rp0",
);
const reviewCategoryLabel = computed(() =>
  selectedCategory.value?.nama_kategori ?? "Kategori belum dipilih",
);
const reviewSectionLabel = computed(() =>
  selectedSection.value?.nama_seksi ?? "—",
);
const reviewDateLabel = computed(() => {
  if (!formInput.value.tanggal) return "Tanggal belum dipilih";
  const parsed = new Date(`${formInput.value.tanggal}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? formInput.value.tanggal
    : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
});

const resolveElement = (target: FocusTarget) =>
  target instanceof HTMLElement ? target : target?.$el ?? null;

const focusSubmitTrigger = async () => {
  await nextTick();
  resolveElement(submitButton.value)?.focus();
};

const clearError = (field: FieldName) => {
  validationErrors.value[field] = "";
  submitError.value = "";
};

const validate = () => {
  const errors = emptyErrors();
  const nominal = parseInputRupiah(formInput.value.jumlah);

  if (!formInput.value.kategori_id) {
    errors.kategori = "Pilih kategori yang sesuai dengan arus transaksi.";
  }
  if (!Number.isFinite(nominal) || nominal <= 0) {
    errors.jumlah = "Masukkan nominal lebih dari Rp0.";
  }
  if (!formInput.value.tanggal) {
    errors.tanggal = "Pilih tanggal transaksi.";
  }
  if (formInput.value.keperluan.trim().length < 5) {
    errors.keperluan = "Tulis keperluan minimal 5 karakter.";
  }
  if (formInput.value.keterangan.trim().length > 1000) {
    errors.keterangan = "Keterangan tambahan maksimum 1000 karakter.";
  }

  validationErrors.value = errors;
  return !Object.values(errors).some(Boolean);
};

const focusFirstError = async () => {
  await nextTick();
  const first = validationOrder.find((field) => validationErrors.value[field]);
  const target = {
    kategori: categoryTrigger.value,
    jumlah: amountInput.value,
    tanggal: dateTrigger.value,
    keperluan: purposeInput.value,
    keterangan: descriptionInput.value,
  }[first ?? "kategori"];
  const fallback = resolveElement(target);
  if (first === "kategori") {
    fallback?.focus();
    return;
  }
  fallback?.focus();
};

const submitForm = async () => {
  submitError.value = "";
  if (!validate()) {
    await focusFirstError();
    toast.error("Periksa kembali kolom yang ditandai.");
    return;
  }
  toast.dismiss();
  isConfirmDialogOpen.value = true;
};

const closeConfirmDialog = async () => {
  if (isLoading.value) return;
  isConfirmDialogOpen.value = false;
  await focusSubmitTrigger();
};

const executeSubmit = async () => {
  try {
    await handleDirectInput();
    isConfirmDialogOpen.value = false;
    validationErrors.value = emptyErrors();
    submitError.value = "";
    await focusSubmitTrigger();
    toast.success("Transaksi kas berhasil disimpan dan buku kas telah diperbarui.");
  } catch (error: unknown) {
    isConfirmDialogOpen.value = false;
    if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
      validationErrors.value.kategori = error.fields.kategori_id ?? "";
      validationErrors.value.jumlah = error.fields.jumlah ?? "";
      validationErrors.value.tanggal = error.fields.tanggal ?? "";
      validationErrors.value.keperluan = error.fields.keperluan ?? "";
      validationErrors.value.keterangan = error.fields.keterangan ?? "";
      await focusFirstError();
    } else {
      await focusSubmitTrigger();
    }
    submitError.value =
      error instanceof Error
        ? error.message
        : "Transaksi belum dapat disimpan. Coba lagi dengan data yang sama.";
    toast.error(
      error instanceof ApiError && error.status === 409
        ? "Permintaan berbenturan dengan proses lain. Data belum digandakan; coba lagi."
        : submitError.value,
    );
  }
};
</script>

<template>
  <section data-direct-cash-desk class="space-y-5">
    <Dialog :open="isConfirmDialogOpen" @update:open="(open) => { if (!open && !isLoading) closeConfirmDialog(); }">
      <DialogContent
        :show-close-button="false"
        class="grid max-h-[calc(100dvh-2rem)] max-w-[44rem] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-4 sm:p-5 xl:max-h-[calc(100dvh-4rem)]"
        @escape-key-down="isLoading && $event.preventDefault()"
        @pointer-down-outside="isLoading && $event.preventDefault()"
        @interact-outside="isLoading && $event.preventDefault()"
      >
        <DialogHeader>
          <DialogTitle>Simpan transaksi kas?</DialogTitle>
          <DialogDescription>
            Periksa slip pencatatan berikut sebelum transaksi langsung masuk ke buku kas.
          </DialogDescription>
        </DialogHeader>

        <div class="min-h-0 overflow-y-auto overscroll-contain px-0.5">
          <DirectCashSlip
            :title="reviewTitle"
            :amount="reviewAmount"
            :flow="flowLabel"
            :flow-tone="activeFlow.emphasisClass"
            :category="reviewCategoryLabel"
            :date="reviewDateLabel"
            :section="reviewSectionLabel"
            :description="formInput.keterangan"
          />
        </div>

        <DialogFooter class="gap-2">
          <Button variant="outline" class="min-h-11 xl:h-8 xl:min-h-8" :disabled="isLoading" @click="closeConfirmDialog">Batal</Button>
          <Button class="min-h-11 xl:h-8 xl:min-h-8" :disabled="isLoading" :aria-busy="isLoading" @click="executeSubmit">
            <LoaderCircle v-if="isLoading" class="size-4 animate-spin" />
            <Save v-else class="size-4" />
            {{ isLoading ? "Memproses..." : "Simpan transaksi" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <form data-entry-spine class="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10" novalidate @submit.prevent="submitForm">
      <div data-entry-decision class="grid grid-cols-[minmax(0,1fr)] border-b xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
        <section class="min-w-0 space-y-3 border-b bg-muted/45 p-4 sm:p-5 xl:border-b-0 xl:border-r" aria-labelledby="cash-flow-title">
          <div class="space-y-1">
            <h3 id="cash-flow-title" class="text-base font-semibold tracking-tight">Arahkan transaksi</h3>
            <p class="text-xs text-muted-foreground">Pilih arus kas sebelum menulis nominal.</p>
          </div>
          <fieldset :disabled="isLoading" class="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1" role="radiogroup" aria-label="Arus transaksi" data-cash-flow-switch>
            <legend class="sr-only">Pilih arus kas</legend>
            <label v-for="option in flowOptions" :key="option.value" class="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 xl:h-9 xl:min-h-9" :class="formInput.tipe === option.value ? option.activeClass : option.idleClass">
              <input v-model="formInput.tipe" class="sr-only" type="radio" :value="option.value" :aria-label="option.label">
              <component :is="option.icon" class="size-4 shrink-0" aria-hidden="true" />
              <span class="min-w-0 flex-1 text-sm font-semibold">{{ option.label }}</span>
            </label>
          </fieldset>
        </section>

        <section class="flex flex-col justify-center p-4 sm:p-5 xl:px-6" aria-labelledby="cash-amount-title">
          <FormField label="Nominal transaksi" required :error="validationErrors.jumlah">
            <template #control="field">
              <div class="border-b border-input transition-colors focus-within:border-ring focus-within:shadow-[0_1px_0_0_var(--ring)]" :class="field.invalid && 'border-destructive'">
                <div class="flex items-end gap-3">
                  <span class="pb-2 text-lg font-semibold text-muted-foreground">Rp</span>
                  <input :id="field.id" ref="amountInput" :value="formInput.jumlah" inputmode="numeric" autocomplete="off" placeholder="0" :aria-invalid="field.invalid || undefined" :aria-describedby="field.describedby" class="min-h-14 min-w-0 flex-1 bg-transparent text-[2.25rem] font-semibold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/70 sm:text-[2.5rem] xl:text-[2.75rem]" @input="formInput.jumlah = formatInputRupiah(($event.target as HTMLInputElement).value); clearError('jumlah')">
                </div>
              </div>
            </template>
          </FormField>
        </section>
      </div>

      <section data-entry-identity class="p-4 sm:p-5 xl:px-6">
        <div class="mb-4">
          <h3 class="text-base font-semibold tracking-tight">Identitas transaksi</h3>
          <p class="mt-1 text-xs text-muted-foreground">Keperluan menjadi judul di buku kas; tanggal dan kategori melengkapi konteksnya.</p>
        </div>
        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(12rem,0.7fr)_minmax(13rem,0.8fr)] xl:gap-3">
          <div class="lg:col-span-2 xl:col-span-1">
            <FormField label="Keperluan" control-gap="comfortable" required :error="validationErrors.keperluan"><template #control="field"><Input :id="field.id" ref="purposeInput" v-model="formInput.keperluan" maxlength="120" placeholder="Contoh: Donasi renovasi tempat wudu" :aria-invalid="field.invalid || undefined" :aria-describedby="field.describedby" class="h-11 xl:h-8" @input="clearError('keperluan')" /></template></FormField>
          </div>
          <FormField label="Tanggal transaksi" control-gap="comfortable" required :error="validationErrors.tanggal"><template #control="field"><DatePicker :id="field.id" ref="dateTrigger" v-model="formInput.tanggal" :invalid="field.invalid" :describedby="field.describedby" :labelledby="field.labelledby" placeholder="Pilih tanggal" class="xl:h-8 xl:min-h-8" @update:model-value="clearError('tanggal')" /></template></FormField>
          <FormField label="Kategori" control-gap="comfortable" required :error="validationErrors.kategori"><template #control="field"><DropdownMenu><DropdownMenuTrigger as-child><Button :id="field.id" ref="categoryTrigger" type="button" variant="outline" class="h-11 w-full justify-between px-3 font-normal xl:h-8" :aria-invalid="field.invalid || undefined" :aria-describedby="field.describedby" :aria-labelledby="field.labelledby"><span :class="!selectedCategory && 'text-muted-foreground'">{{ selectedCategory?.nama_kategori ?? "Pilih kategori" }}</span><ChevronDown class="size-4 text-muted-foreground" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuRadioGroup :model-value="formInput.kategori_id ? String(formInput.kategori_id) : ''" @update:model-value="(value) => { formInput.kategori_id = Number(value); clearError('kategori'); }"><DropdownMenuRadioItem v-for="category in filteredCategoriesInput" :key="category.id" :value="String(category.id)" class="h-11 px-2 pr-8 xl:h-8">{{ category.nama_kategori }}</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu></template></FormField>
          <div class="lg:col-span-2 xl:col-span-3"><FormField label="Keterangan tambahan" description="Opsional. Tampil pada detail transaksi, bukan sebagai judul aktivitas." :error="validationErrors.keterangan"><template #control="field"><Textarea :id="field.id" ref="descriptionInput" v-model="formInput.keterangan" rows="3" placeholder="Tambahkan konteks bila diperlukan." :invalid="field.invalid" :describedby="field.describedby" @input="clearError('keterangan')" /></template></FormField></div>
        </div>

        <Collapsible v-model:open="secondaryOpen" class="mt-4 border-t pt-3"><CollapsibleTrigger as-child><Button type="button" variant="ghost" class="min-h-11 px-0 text-sm font-medium text-primary hover:bg-transparent xl:h-8 xl:min-h-8"><span>＋ Tambahkan seksi pelapor</span><ChevronDown class="size-4 transition-transform" :class="secondaryOpen && 'rotate-180'" /></Button></CollapsibleTrigger><CollapsibleContent class="pt-3"><FormField label="Seksi pelapor" description="Opsional."><template #control="field"><DropdownMenu><DropdownMenuTrigger as-child><Button :id="field.id" type="button" variant="outline" class="h-11 w-full justify-between px-3 font-normal xl:h-8"><span :class="!selectedSection && 'text-muted-foreground'">{{ selectedSection?.nama_seksi ?? "Tanpa seksi" }}</span><ChevronDown class="size-4 text-muted-foreground" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" class="!w-[min(32rem,calc(100vw-2rem))]"><DropdownMenuRadioGroup class="grid grid-cols-2" :model-value="formInput.seksi_id ? String(formInput.seksi_id) : 'none'" @update:model-value="(value) => { formInput.seksi_id = value === 'none' ? null : Number(value); }"><DropdownMenuRadioItem value="none" class="h-11 min-w-0 whitespace-nowrap px-2 pr-8 xl:h-8">Tanpa seksi</DropdownMenuRadioItem><DropdownMenuRadioItem v-for="section in sections" :key="section.id" :value="String(section.id)" class="h-11 min-w-0 whitespace-nowrap px-2 pr-8 xl:h-8">{{ section.nama_seksi }}</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu></template></FormField></CollapsibleContent></Collapsible>

        <p v-if="submitError" role="alert" class="mt-4 border-l-2 border-destructive bg-destructive/5 px-3 py-3 text-sm leading-6 text-destructive">{{ submitError }} Semua input tetap dipertahankan untuk percobaan berikutnya.</p>
      </section>

      <footer data-entry-closure class="grid gap-3 border-t bg-muted/45 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 xl:px-6">
        <div class="min-w-0"><p class="text-[0.6875rem] text-muted-foreground">Belum disimpan · review final berikutnya</p><p class="mt-0.5 line-clamp-2 text-sm font-semibold sm:truncate">{{ flowLabel }} · {{ reviewAmount }} — {{ reviewTitle }}</p></div>
        <Button ref="submitButton" type="submit" class="min-h-11 w-full sm:w-auto xl:h-8 xl:min-h-8" :disabled="isLoading" :aria-busy="isLoading"><LoaderCircle v-if="isLoading" class="size-4 animate-spin" /><Eye v-else class="size-4" />{{ isLoading ? "Menyimpan…" : "Tinjau & simpan" }}</Button>
      </footer>
    </form>
  </section>
</template>
