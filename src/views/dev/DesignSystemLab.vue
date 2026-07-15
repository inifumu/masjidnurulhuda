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

const query = ref("");
const activeDensity = ref<"comfortable" | "compact">("comfortable");

const transactions = [
  { date: "15 Jul", title: "Infaq Jumat", category: "Infaq & Donasi", amount: "+ Rp 2.400.000", tone: "success" },
  { date: "13 Jul", title: "Perawatan pendingin", category: "Utilitas", amount: "− Rp 1.250.000", tone: "danger" },
];
</script>

<template>
  <main class="min-h-screen bg-background text-foreground">
    <header class="border-b bg-card">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="Logo Masjid Nurul Huda" class="size-10 object-contain" />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">Nurul Huda Design System</p>
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
        <section class="grid items-end gap-6 border-b pb-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,.6fr)]">
          <div>
            <p class="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary">Civic Editorial</p>
            <h1 class="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              Informasi masjid yang hangat, jelas, dan dapat dipercaya.
            </h1>
            <p class="reading-measure mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Satu bahasa visual untuk publikasi jamaah dan pekerjaan operasional pengurus—lebih editorial pada ruang publik, lebih presisi pada data admin.
            </p>
          </div>
          <div class="border-l-2 border-[var(--brand-gold)] pl-4">
            <p class="text-sm font-semibold">Prinsip permukaan</p>
            <p class="mt-1 text-sm leading-6 text-muted-foreground">Border dan hierarchy menggantikan blur, glow, dan card dekoratif.</p>
          </div>
        </section>

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
              <label class="space-y-2"><span class="text-sm font-semibold">Contoh error</span><Input aria-invalid="true" value="Data tidak valid" /><span class="text-xs text-destructive">Periksa kembali nilai yang dimasukkan.</span></label>
            </div>
          </div>
        </section>

        <section aria-labelledby="data-title">
          <div class="mb-5"><p class="text-xs font-semibold text-primary">03</p><h2 id="data-title" class="mt-1 text-2xl font-semibold tracking-tight">Data operasional</h2></div>
          <div class="grid gap-4 sm:grid-cols-3">
            <article class="border-t-2 border-primary bg-card px-4 py-5"><p class="text-sm text-muted-foreground">Saldo tersedia</p><p class="font-tabular mt-2 text-2xl font-bold tracking-tight">Rp 24.850.000</p></article>
            <article class="border-t-2 border-success bg-card px-4 py-5"><p class="text-sm text-muted-foreground">Pemasukan</p><p class="font-tabular mt-2 text-2xl font-bold text-success">Rp 8.400.000</p></article>
            <article class="border-t-2 border-destructive bg-card px-4 py-5"><p class="text-sm text-muted-foreground">Pengeluaran</p><p class="font-tabular mt-2 text-2xl font-bold text-destructive">Rp 5.125.000</p></article>
          </div>
          <div class="mt-4 overflow-hidden rounded-md border bg-card">
            <div class="hidden grid-cols-[7rem_1fr_12rem] border-b bg-muted/50 px-4 py-3 text-xs font-semibold text-muted-foreground md:grid"><span>Tanggal</span><span>Transaksi</span><span class="text-right">Nominal</span></div>
            <article v-for="item in transactions" :key="item.title" class="grid gap-2 border-b px-4 py-4 last:border-0 md:grid-cols-[7rem_1fr_12rem] md:items-center">
              <time class="text-xs text-muted-foreground md:text-sm">{{ item.date }}</time>
              <div><p class="font-semibold">{{ item.title }}</p><p class="text-sm text-muted-foreground">{{ item.category }}</p></div>
              <strong class="font-tabular text-sm md:text-right" :class="item.tone === 'success' ? 'text-success' : 'text-destructive'">{{ item.amount }}</strong>
            </article>
          </div>
        </section>

        <section aria-labelledby="states-title">
          <div class="mb-5"><p class="text-xs font-semibold text-primary">04</p><h2 id="states-title" class="mt-1 text-2xl font-semibold tracking-tight">Bahasa status</h2></div>
          <div class="divide-y border-y bg-card">
            <div class="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><p class="font-semibold text-success">Tersimpan</p><p class="text-sm text-muted-foreground">Publikasi siap ditinjau.</p></div>
            <div class="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><p class="font-semibold text-warning">Menunggu</p><p class="text-sm text-muted-foreground">Ketua belum meninjau proposal.</p></div>
            <div class="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><p class="font-semibold text-info">Diperbarui</p><p class="text-sm text-muted-foreground">Ringkasan mengikuti periode Juli.</p></div>
            <div class="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><p class="font-semibold text-destructive">Gagal dimuat</p><p class="text-sm text-muted-foreground">Pertahankan data lama dan sediakan retry.</p></div>
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
