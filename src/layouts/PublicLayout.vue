<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { LogIn, Menu, X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

const isMobileMenuOpen = ref(false);
const menuButton = ref<HTMLButtonElement | null>(null);
const firstMobileLink = ref<HTMLAnchorElement | null>(null);

const navigation = [
  { href: "#profil", label: "Beranda" },
  { href: "#jadwal", label: "Jadwal salat" },
  { href: "#kas", label: "Transparansi kas" },
  { href: "#kabar", label: "Kabar" },
  { href: "#galeri", label: "Galeri" },
];

const closeMobileMenu = (restoreFocus = false) => {
  isMobileMenuOpen.value = false;
  if (restoreFocus) nextTick(() => menuButton.value?.focus());
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!isMobileMenuOpen.value) return;
  if (event.key === "Escape") {
    closeMobileMenu(true);
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      "#public-mobile-navigation a[href], #public-mobile-navigation button:not([disabled])",
    ),
  );
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

watch(isMobileMenuOpen, async (open) => {
  document.body.style.overflow = open ? "hidden" : "";
  if (open) {
    await nextTick();
    firstMobileLink.value?.focus();
  }
});

document.addEventListener("keydown", handleKeydown);
onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header class="sticky top-0 z-50 border-b bg-background">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-18 lg:px-8">
        <a href="#profil" class="flex min-h-11 items-center gap-3 rounded-sm font-semibold tracking-tight" aria-label="Masjid Nurul Huda, kembali ke awal halaman">
          <img src="/logo.png" alt="" class="size-9 object-contain" />
          <span>Masjid Nurul Huda</span>
        </a>

        <nav class="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          <a v-for="item in navigation" :key="item.href" :href="item.href" class="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground">{{ item.label }}</a>
        </nav>

        <div class="flex items-center gap-2">
          <Button as-child variant="outline" class="hidden lg:inline-flex">
            <router-link to="/admin/login"><LogIn class="size-4" aria-hidden="true" />Portal Pengurus</router-link>
          </Button>
          <button ref="menuButton" type="button" class="inline-flex size-11 items-center justify-center rounded-sm border bg-card text-foreground lg:hidden" :aria-expanded="isMobileMenuOpen" aria-controls="public-mobile-navigation" :aria-label="isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'" @click="isMobileMenuOpen = !isMobileMenuOpen">
            <X v-if="isMobileMenuOpen" class="size-5" aria-hidden="true" /><Menu v-else class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div v-if="isMobileMenuOpen" class="fixed inset-x-0 bottom-0 top-16 z-50 bg-background lg:hidden">
        <nav id="public-mobile-navigation" class="mx-auto flex max-w-7xl flex-col px-4 py-5" aria-label="Navigasi mobile">
          <a v-for="(item, index) in navigation" :key="item.href" :ref="index === 0 ? (element) => (firstMobileLink = element as HTMLAnchorElement) : undefined" :href="item.href" class="flex min-h-12 items-center border-b px-2 text-base font-medium" @click="closeMobileMenu()">{{ item.label }}</a>
          <router-link to="/admin/login" class="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border bg-card px-4 text-sm font-semibold text-brand-green" @click="closeMobileMenu()"><LogIn class="size-4" aria-hidden="true" />Portal Pengurus</router-link>
        </nav>
      </div>
    </header>

    <main class="flex-1"><router-view /></main>

    <footer class="border-t bg-[var(--brand-emerald-deep)] text-white">
      <div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
        <div>
          <div class="flex items-center gap-3"><img src="/logo.png" alt="" class="size-10 object-contain" /><p class="text-lg font-semibold">Masjid Nurul Huda</p></div>
          <p class="mt-4 max-w-xl text-sm leading-6 text-white/70">Kanal informasi publik masjid. Alamat, kontak, layanan donasi, dan data publikasi lain tidak ditampilkan sebelum sumber resminya terverifikasi.</p>
        </div>
        <nav class="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Navigasi footer">
          <a href="#jadwal" class="min-h-11 py-3 text-white/80 hover:text-white">Jadwal salat</a>
          <a href="#kas" class="min-h-11 py-3 text-white/80 hover:text-white">Transparansi kas</a>
          <router-link to="/admin/login" class="min-h-11 py-3 text-white/80 hover:text-white">Portal Pengurus</router-link>
        </nav>
      </div>
      <div class="border-t border-white/15"><div class="mx-auto max-w-7xl px-4 py-5 text-xs text-white/60 sm:px-6 lg:px-8">© {{ new Date().getFullYear() }} Masjid Nurul Huda. Informasi mengikuti zona waktu Asia/Jakarta.</div></div>
    </footer>
  </div>
</template>
