<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useMediaQuery } from "@vueuse/core";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  LoaderCircle,
  ReceiptText,
  Save,
  WalletCards,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useKas } from "@/composables/admin/useKas";
import { ApiError } from "@/services/httpClient";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const isWideDesktop = useMediaQuery("(min-width: 1280px)");

type FieldName = "kategori" | "jumlah" | "tanggal" | "keperluan" | "keterangan";
type ValidationErrors = Record<FieldName, string>;
type FocusTarget = HTMLElement | { $el?: HTMLElement } | null;

const flowOptions = [
  {
    value: "pemasukan",
    label: "Pemasukan",
    caption: "Catat dana yang masuk ke kas masjid.",
    icon: ArrowUpRight,
    activeClass: "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/10",
    idleClass: "border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary/70",
  },
  {
    value: "pengeluaran",
    label: "Pengeluaran",
    caption: "Catat belanja atau biaya operasional rutin.",
    icon: ArrowDownRight,
    activeClass: "border-destructive bg-destructive text-destructive-foreground shadow-sm shadow-destructive/10",
    idleClass: "border-border bg-card text-foreground hover:border-destructive/30 hover:bg-secondary/70",
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
const isConfirmModalOpen = ref(false);
const secondaryOpen = ref(false);
const submitError = ref("");
const categoryTrigger = ref<FocusTarget>(null);
const amountInput = ref<HTMLInputElement | null>(null);
const dateInput = ref<HTMLInputElement | null>(null);
const purposeInput = ref<HTMLInputElement | null>(null);
const descriptionInput = ref<HTMLTextAreaElement | null>(null);
const submitButton = ref<FocusTarget>(null);

const selectedCategory = computed(() =>
  filteredCategoriesInput.value.find((item) => item.id === formInput.value.kategori_id),
);
const selectedSection = computed(() =>
  sections.value.find((item) => item.id === formInput.value.seksi_id),
);
const flowLabel = computed(() =>
  formInput.value.tipe === "pemasukan" ? "Pemasukan" : "Pengeluaran",
);
const reviewTitle = computed(() => formInput.value.keperluan || "Keperluan belum diisi");
const reviewAmount = computed(() =>
  formInput.value.jumlah ? formatRupiah(parseInputRupiah(formInput.value.jumlah)) : "Rp0",
);
const reviewCategoryLabel = computed(() =>
  selectedCategory.value?.nama_kategori ?? "Kategori belum dipilih",
);
const reviewSectionLabel = computed(() =>
  selectedSection.value?.nama_seksi ?? "Tanpa seksi pelapor",
);
const reviewDateLabel = computed(() => formInput.value.tanggal || "Tanggal belum dipilih");
const confirmationMessage = computed(
  () => `${formInput.value.keperluan}: simpan ${flowLabel.value.toLowerCase()} sebesar ${reviewAmount.value} pada kategori ${reviewCategoryLabel.value}? Transaksi akan langsung berstatus disetujui.`,
);

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
  const first = (Object.keys(validationErrors.value) as FieldName[]).find(
    (field) => validationErrors.value[field],
  );
  const invalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
  const target = {
    kategori: categoryTrigger.value,
    jumlah: amountInput.value,
    tanggal: dateInput.value,
    keperluan: purposeInput.value,
    keterangan: descriptionInput.value,
  }[first ?? "kategori"];
  const fallback = resolveElement(target);
  if (first === "kategori") {
    fallback?.focus();
    return;
  }
  (invalid ?? fallback)?.focus();
};

const submitForm = async () => {
  submitError.value = "";
  if (!validate()) {
    await focusFirstError();
    toast.error("Periksa kembali kolom yang ditandai.");
    return;
  }
  isConfirmModalOpen.value = true;
};

const executeSubmit = async () => {
  try {
    await handleDirectInput();
    isConfirmModalOpen.value = false;
    validationErrors.value = emptyErrors();
    submitError.value = "";
    toast.success("Transaksi kas berhasil disimpan dan buku kas telah diperbarui.");
  } catch (error: unknown) {
    isConfirmModalOpen.value = false;
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
  <section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <ConfirmModal
      :isOpen="isConfirmModalOpen"
      :pending="isLoading"
      title="Simpan transaksi kas?"
      :message="confirmationMessage"
      type="success"
      confirmText="Simpan transaksi"
      @close="isConfirmModalOpen = false"
      @confirm="executeSubmit"
    />

    <form class="space-y-6" novalidate @submit.prevent="submitForm">
      <section class="grid gap-4 rounded-lg border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:p-5">
        <div class="space-y-1.5">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Langkah 1</p>
          <h3 class="text-lg font-semibold tracking-tight">Tentukan arus kas lebih dulu</h3>
          <p class="text-sm leading-6 text-muted-foreground">
            Pilihan arus mengarahkan kategori dan memberi konteks utama pada slip transaksi.
          </p>
        </div>

        <fieldset
          :disabled="isLoading"
          class="grid gap-3"
          role="radiogroup"
          aria-label="Arus transaksi"
          data-cash-flow-switch
        >
          <legend class="sr-only">Pilih arus kas</legend>
          <label
            v-for="option in flowOptions"
            :key="option.value"
            class="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors xl:min-h-8 xl:px-3 xl:py-2.5"
            :class="formInput.tipe === option.value ? option.activeClass : option.idleClass"
          >
            <input
              v-model="formInput.tipe"
              class="sr-only"
              type="radio"
              :value="option.value"
              :aria-label="option.label"
            >
            <component :is="option.icon" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span class="min-w-0">
              <span class="block text-sm font-semibold">{{ option.label }}</span>
              <span class="mt-1 block text-xs leading-5 opacity-90">{{ option.caption }}</span>
            </span>
          </label>
        </fieldset>
      </section>

      <section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="space-y-5 rounded-lg border bg-card p-4 lg:p-5">
          <div class="space-y-1.5">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Langkah 2</p>
            <h3 class="text-lg font-semibold tracking-tight">Isi nominal dan identitas slip</h3>
            <p class="text-sm leading-6 text-muted-foreground">
              Nominal dan keperluan menjadi fokus utama sebelum metadata tambahan dibuka.
            </p>
          </div>

          <FormField
            label="Nominal"
            description="Nilai akan disimpan dalam Rupiah."
            required
            :error="validationErrors.jumlah"
          >
            <template #control="field">
              <div
                class="flex rounded-sm border border-input bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
                :class="field.invalid && 'border-destructive ring-2 ring-destructive/20'"
              >
                <span class="flex min-h-11 items-center border-r px-3 text-sm font-semibold text-muted-foreground xl:min-h-8">
                  Rp
                </span>
                <input
                  :id="field.id"
                  ref="amountInput"
                  :value="formInput.jumlah"
                  inputmode="numeric"
                  autocomplete="off"
                  placeholder="0"
                  :aria-invalid="field.invalid || undefined"
                  :aria-describedby="field.describedby"
                  class="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-lg font-semibold tabular-nums outline-none xl:min-h-8"
                  @input="formInput.jumlah = formatInputRupiah(($event.target as HTMLInputElement).value); clearError('jumlah')"
                >
              </div>
            </template>
          </FormField>

          <FormField label="Keperluan" description="Judul singkat yang tampil di buku kas dan slip." required :error="validationErrors.keperluan">
            <template #control="field">
              <Input
                :id="field.id"
                ref="purposeInput"
                v-model="formInput.keperluan"
                maxlength="120"
                placeholder="Contoh: Pembelian perlengkapan kebersihan masjid"
                :aria-invalid="field.invalid || undefined"
                :aria-describedby="field.describedby"
                @input="clearError('keperluan')"
              />
            </template>
          </FormField>

          <FormField label="Keterangan tambahan" description="Opsional. Tambahkan rincian bila diperlukan." :error="validationErrors.keterangan">
            <template #control="field">
              <Textarea
                :id="field.id"
                ref="descriptionInput"
                v-model="formInput.keterangan"
                rows="4"
                placeholder="Contoh: Sapu, pel, cairan pembersih, dan kantong sampah untuk operasional bulanan."
                :invalid="field.invalid"
                :describedby="field.describedby"
                @input="clearError('keterangan')"
              />
            </template>
          </FormField>

          <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <FormField label="Kategori" required :error="validationErrors.kategori">
              <template #control="field">
                <Select v-model="formInput.kategori_id" @update:model-value="clearError('kategori')">
                  <SelectTrigger
                    :id="field.id"
                    ref="categoryTrigger"
                    :aria-invalid="field.invalid || undefined"
                    :aria-describedby="field.describedby"
                    class="xl:h-8"
                  >
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="category in filteredCategoriesInput"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.nama_kategori }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </template>
            </FormField>

            <FormField label="Tanggal transaksi" required :error="validationErrors.tanggal">
              <template #control="field">
                <Input
                  :id="field.id"
                  ref="dateInput"
                  v-model="formInput.tanggal"
                  type="date"
                  :aria-invalid="field.invalid || undefined"
                  :aria-describedby="field.describedby"
                  class="xl:h-8"
                  @input="clearError('tanggal')"
                />
              </template>
            </FormField>
          </section>
        </div>

        <aside v-if="isWideDesktop" data-live-cash-slip class="sticky top-4 self-start" aria-label="Slip transaksi langsung">
          <div class="rounded-lg border bg-card p-5 shadow-sm">
            <div class="flex items-start gap-3">
              <div class="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ReceiptText class="size-5" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Slip kas langsung</p>
                <h3 class="mt-2 text-lg font-semibold leading-snug">{{ reviewTitle }}</h3>
                <p v-if="formInput.keterangan.trim()" class="mt-2 text-sm leading-6 text-muted-foreground">
                  {{ formInput.keterangan }}
                </p>
              </div>
            </div>

            <div class="mt-5 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 class="size-4 text-primary" />
              Langsung disetujui
            </div>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Gunakan hanya untuk transaksi rutin yang tidak memerlukan alur proposal.
            </p>

            <dl class="mt-5 divide-y border-y text-sm">
              <div class="flex justify-between gap-4 py-3">
                <dt class="text-muted-foreground">Arus</dt>
                <dd class="font-medium">{{ flowLabel }}</dd>
              </div>
              <div class="flex justify-between gap-4 py-3">
                <dt class="text-muted-foreground">Nominal</dt>
                <dd class="font-semibold tabular-nums">{{ reviewAmount }}</dd>
              </div>
              <div class="flex justify-between gap-4 py-3">
                <dt class="text-muted-foreground">Kategori</dt>
                <dd class="max-w-[11rem] truncate text-right font-medium">{{ reviewCategoryLabel }}</dd>
              </div>
              <div class="flex justify-between gap-4 py-3">
                <dt class="text-muted-foreground">Tanggal</dt>
                <dd class="font-medium">{{ reviewDateLabel }}</dd>
              </div>
              <div v-if="selectedSection" class="flex justify-between gap-4 py-3">
                <dt class="text-muted-foreground">Seksi</dt>
                <dd class="max-w-[11rem] truncate text-right font-medium">{{ reviewSectionLabel }}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>

      <section v-if="!isWideDesktop" data-compact-cash-recap class="rounded-lg border bg-card p-4" aria-label="Ringkasan sebelum ditinjau">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ringkasan cepat</p>
            <p class="mt-2 text-sm text-muted-foreground">{{ flowLabel }} · {{ reviewCategoryLabel }}</p>
            <p class="mt-1 line-clamp-2 font-semibold">{{ reviewTitle }}</p>
          </div>
          <strong class="shrink-0 text-base font-semibold tabular-nums">{{ reviewAmount }}</strong>
        </div>
        <p v-if="formInput.keterangan.trim()" class="mt-3 text-sm leading-6 text-muted-foreground">
          {{ formInput.keterangan }}
        </p>
        <div class="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 class="size-4 text-primary" />
          Transaksi akan langsung masuk buku kas setelah Anda konfirmasi.
        </div>
      </section>

      <Collapsible v-model:open="secondaryOpen" class="rounded-lg border bg-card p-4 lg:p-5">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1.5">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Langkah 3</p>
            <h3 class="text-lg font-semibold tracking-tight">Metadata tambahan</h3>
            <p class="text-sm leading-6 text-muted-foreground">
              Seksi pelapor tetap opsional dan dibuka hanya bila diperlukan.
            </p>
          </div>
          <CollapsibleTrigger as-child>
            <Button type="button" variant="outline" class="min-h-11 shrink-0 xl:min-h-8">
              <FileText class="size-4" />
              {{ secondaryOpen ? "Sembunyikan" : "Buka detail" }}
              <ChevronDown class="size-4 transition-transform" :class="secondaryOpen && 'rotate-180'" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent class="pt-4">
          <FormField label="Seksi pelapor" description="Opsional. Pilih bila transaksi berasal dari laporan seksi tertentu.">
            <template #control="field">
              <Select v-model="formInput.seksi_id">
                <SelectTrigger :id="field.id" class="xl:h-8">
                  <SelectValue placeholder="Tanpa seksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="null">Tanpa seksi</SelectItem>
                  <SelectItem v-for="section in sections" :key="section.id" :value="section.id">
                    {{ section.nama_seksi }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </template>
          </FormField>
        </CollapsibleContent>
      </Collapsible>

      <p v-if="submitError" role="alert" class="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {{ submitError }} Input tetap dipertahankan agar dapat dicoba kembali.
      </p>

      <div class="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1 text-xs leading-5 text-muted-foreground sm:max-w-md">
          <p>Periksa nominal, kategori, dan judul slip sebelum menyimpan.</p>
          <p>Pencatatan langsung akan memperbarui buku kas tanpa membuat proposal baru.</p>
        </div>
        <Button
          ref="submitButton"
          type="submit"
          class="min-h-11 shrink-0 xl:min-h-8"
          :disabled="isLoading"
          :aria-busy="isLoading"
        >
          <LoaderCircle v-if="isLoading" class="size-4 animate-spin" />
          <template v-else>
            <WalletCards class="size-4" />
            <Save class="size-4" data-icon="inline-end" />
          </template>
          {{ isLoading ? "Menyimpan…" : "Tinjau & simpan" }}
        </Button>
      </div>
    </form>
  </section>
</template>
