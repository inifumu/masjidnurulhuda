<!--
  Tujuan: Component lab development-only untuk memverifikasi fondasi visual Civic Editorial.
  Caller: Route /_design-system yang hanya diregistrasikan pada import.meta.env.DEV.
  Dependensi: Primitive Button/Input, lucide-vue-next, token global DESIGN.md.
  Main Functions: Menampilkan typography, warna, controls, status, data states, dan responsive specimen.
  Side Effects: Tidak ada request API atau mutasi persistence.
-->
<script setup lang="ts">
import { ref } from "vue";
import { ArrowRight, Plus, Search } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Metric } from "@/components/ui/metric";
import { StatusIndicator } from "@/components/ui/status";
import { ConflictState, EmptyState, ErrorState, PermissionState } from "@/components/ui/data-state";
import { FormField } from "@/components/ui/form-field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "@/components/ui/datepicker/DatePicker.vue";
import { Combobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/ui/data-table";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { Timeline } from "@/components/ui/timeline";

const query = ref("");
const amount = ref("");
const category = ref("");
const activityDate = ref<string | null>(null);
const section = ref("");
const sectionOptions = [
  { value: "dakwah", label: "Seksi Dakwah" },
  { value: "sosial", label: "Seksi Sosial" },
  { value: "sarana", label: "Seksi Sarana" },
];
const activeDensity = ref<"comfortable" | "compact">("comfortable");

const transactions = [
  { date: "15 Jul", title: "Infaq Jumat", category: "Infaq & Donasi", amount: "+ Rp 2.400.000", tone: "success" },
  { date: "13 Jul", title: "Perawatan pendingin", category: "Utilitas", amount: "− Rp 1.250.000", tone: "danger" },
];
const timelineItems = [
  { id: 1, title: "Proposal diajukan", description: "Seksi Dakwah mengirim proposal kegiatan." },
  { id: 2, title: "Disetujui Ketua", description: "Proposal diteruskan ke Bendahara." },
];
</script>

<template>
  <main class="min-h-screen bg-background text-foreground">
    <header class="border-b bg-card">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="Logo Masjid Nurul Huda" class="size-10 object-contain" />
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-5">Nurul Huda Design System</p>
            <p class="text-xs text-muted-foreground">Development component lab · R1</p>
          </div>
        </div>
        <Button variant="outline" @click="activeDensity = activeDensity === 'comfortable' ? 'compact' : 'comfortable'">
          {{ activeDensity === "comfortable" ? "Nyaman" : "Ringkas" }}
        </Button>
      </div>
    </header>

    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="min-w-0 space-y-12">
        <PageHeader eyebrow="Civic Editorial" title="Informasi masjid yang hangat, jelas, dan dapat dipercaya." description="Satu bahasa visual untuk publikasi jamaah dan pekerjaan operasional pengurus—editorial pada ruang publik, presisi pada data admin.">
          <template #actions><Button>Mulai publikasi</Button></template>
        </PageHeader>

        <section aria-labelledby="colors-title">
          <div class="mb-5 flex items-end justify-between gap-4">
            <div><p class="text-xs font-semibold text-primary">01</p><h2 id="colors-title" class="mt-1 text-2xl font-semibold tracking-tight">Warna dan surface</h2></div>
            <p class="hidden text-sm text-muted-foreground sm:block">Emerald memimpin. Gold menandai perhatian.</p>
          </div>
          <div class="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-4">
            <div class="min-h-32 bg-[#0B6B4B] p-4 text-white"><strong>Emerald</strong><span class="mt-12 block text-xs opacity-75">#0B6B4B</span></div>
            <div class="min-h-32 bg-[#D6A62E] p-4 text-[#17211C]"><strong>Gold</strong><span class="mt-12 block text-xs opacity-75">#D6A62E</span></div>
            <div class="min-h-32 bg-[#F7F7F2] p-4 text-[#17211C]"><strong>Warm</strong><span class="mt-12 block text-xs opacity-75">#F7F7F2</span></div>
            <div class="min-h-32 bg-[#17211C] p-4 text-white"><strong>Ink</strong><span class="mt-12 block text-xs opacity-75">#17211C</span></div>
          </div>
        </section>

        <section aria-labelledby="controls-title">
          <div class="mb-5"><p class="text-xs font-semibold text-primary">02</p><h2 id="controls-title" class="mt-1 text-2xl font-semibold tracking-tight">Kontrol dan formulir</h2></div>
          <div class="space-y-6 rounded-md border bg-card p-4 sm:p-6">
            <div class="flex flex-wrap gap-3">
              <Button><Plus /> Tambah publikasi</Button>
              <Button variant="outline" class="border-[var(--brand-gold)] text-[var(--brand-gold-strong)]">Lihat jadwal <ArrowRight /></Button>
              <Button variant="outline">Simpan draft</Button>
              <Button variant="ghost">Batal</Button>
              <Button variant="destructive">Hapus</Button>
              <Button disabled>Memproses…</Button>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <label class="space-y-2"><span class="text-sm font-semibold">Cari informasi</span><div class="relative"><Search class="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input v-model="query" class="pl-9" placeholder="Kabar, kegiatan, atau transaksi" /></div></label>
              <FormField label="Nominal transaksi" description="Masukkan nilai penuh tanpa desimal." :error="amount && Number(amount.replaceAll('.', '')) <= 0 ? 'Nominal harus lebih dari 0.' : undefined" required>
                <template #control="control"><CurrencyInput v-bind="control" v-model="amount" placeholder="0" /></template>
              </FormField>
              <FormField label="Kategori kegiatan" description="Gunakan Select untuk daftar pilihan terbatas.">
                <template #control="control">
                  <Select v-model="category">
                    <SelectTrigger v-bind="control"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent><SelectGroup><SelectItem value="kajian">Kajian</SelectItem><SelectItem value="sosial">Kegiatan sosial</SelectItem><SelectItem value="operasional">Operasional</SelectItem></SelectGroup></SelectContent>
                  </Select>
                </template>
              </FormField>
              <FormField label="Tanggal kegiatan" description="Tanggal bisnis mengikuti Asia/Jakarta.">
                <template #control="control"><DatePicker v-bind="control" v-model="activityDate" /></template>
              </FormField>
              <FormField label="Seksi pengurus" description="Gunakan Combobox ketika pilihan perlu dicari.">
                <template #control="control"><Combobox v-bind="control" v-model="section" :options="sectionOptions" placeholder="Pilih seksi" /></template>
              </FormField>
            </div>
          </div>
        </section>

        <section aria-labelledby="data-title">
          <div class="mb-5"><p class="text-xs font-semibold text-primary">03</p><h2 id="data-title" class="mt-1 text-2xl font-semibold tracking-tight">Data operasional</h2></div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Saldo tersedia" value="Rp 24.850.000" detail="Periode Juli 2026" />
            <Metric label="Pemasukan" value="Rp 8.400.000" tone="success" />
            <Metric label="Pengeluaran" value="Rp 5.125.000" tone="destructive" />
          </div>
          <div class="mt-4">
            <DataTable caption="Transaksi terbaru"><template #header><tr><th class="px-4 py-3">Tanggal</th><th class="px-4 py-3">Transaksi</th><th class="px-4 py-3 text-right">Nominal</th></tr></template><tr v-for="item in transactions" :key="item.title"><td class="px-4 py-4">{{ item.date }}</td><td class="px-4 py-4"><strong>{{ item.title }}</strong><p class="text-muted-foreground">{{ item.category }}</p></td><td class="font-tabular px-4 py-4 text-right font-semibold" :class="item.tone === 'success' ? 'text-success' : 'text-destructive'">{{ item.amount }}</td></tr></DataTable>
            <MobileDataCard v-for="item in transactions" :key="`mobile-${item.title}`" :title="item.title" :eyebrow="item.date"><template #value><strong class="font-tabular" :class="item.tone === 'success' ? 'text-success' : 'text-destructive'">{{ item.amount }}</strong></template>{{ item.category }}</MobileDataCard>
          </div>
          <div class="mt-8"><h3 class="mb-4 font-semibold">Riwayat persetujuan</h3><Timeline :items="timelineItems"><template #meta="{ item }"><span class="text-xs text-muted-foreground">Tahap {{ item.id }}</span></template></Timeline></div>
        </section>

        <section aria-labelledby="states-title">
          <div class="mb-5"><p class="text-xs font-semibold text-primary">04</p><h2 id="states-title" class="mt-1 text-2xl font-semibold tracking-tight">Bahasa status</h2></div>
          <div class="flex flex-wrap gap-3"><StatusIndicator tone="success">Tersimpan</StatusIndicator><StatusIndicator tone="warning">Menunggu persetujuan</StatusIndicator><StatusIndicator tone="info">Diperbarui</StatusIndicator><StatusIndicator tone="destructive">Gagal</StatusIndicator></div>
          <div class="mt-6 divide-y border-y">
            <article class="py-6"><p class="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Empty state</p><EmptyState title="Belum ada publikasi" description="Konten baru akan muncul di sini."><template #action><Button>Tambah publikasi</Button></template></EmptyState></article>
            <article class="py-6"><p class="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Recoverable error</p><ErrorState @retry="query = ''" /></article>
            <article class="py-6"><p class="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Permission state</p><PermissionState /></article>
            <article class="py-6"><p class="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Conflict state</p><ConflictState @refresh="query = ''" /></article>
          </div>
        </section>
      </div>

      <aside class="space-y-5 xl:sticky xl:top-6 xl:self-start">
        <div class="rounded-md border bg-card p-5">
          <p class="text-sm font-semibold">Kontrak responsif</p>
          <dl class="mt-4 space-y-3 text-sm"><div><dt class="font-semibold text-primary">Mobile</dt><dd class="text-muted-foreground">360 px · satu kolom · 44 px targets</dd></div><div><dt class="font-semibold text-primary">Tablet</dt><dd class="text-muted-foreground">768–1023 px · dua kolom selektif</dd></div><div><dt class="font-semibold text-primary">Desktop</dt><dd class="text-muted-foreground">Workspace dan reading measure terbatas</dd></div></dl>
        </div>
        <div class="border-l-2 border-[var(--brand-gold)] pl-4">
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand-gold-strong)]">Anti-drift</p>
          <p class="mt-2 text-sm leading-6 text-muted-foreground">Tidak ada V3, primitive duplikat, glass default, atau hardcoded visual pattern di layar.</p>
        </div>
      </aside>
    </div>
  </main>
</template>
