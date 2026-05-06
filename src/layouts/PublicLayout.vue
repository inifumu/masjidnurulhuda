<script setup lang="ts">
import { ref } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import { useTheme } from "../composables/admin/useTheme";
import {
  BookOpen,
  HeartHandshake,
  Home,
  Info,
  LogIn,
  Menu,
  X,
  ImageIcon,
  MessageSquare,
} from "lucide-vue-next";

const { isDark, toggleTheme } = useTheme();

// State untuk menu mobile
const isMobileMenuOpen = ref(false);
const toggleMobileMenu = () =>
  (isMobileMenuOpen.value = !isMobileMenuOpen.value);

// 🟢 FUNGSI CUSTOM SMOOTH SCROLL (Dengan penyesuaian tinggi Sticky Navbar)
const scrollTo = (targetId: string) => {
  // Tutup menu mobile jika sedang terbuka
  isMobileMenuOpen.value = false;

  // Beri sedikit jeda agar animasi tutup menu selesai sebelum menghitung posisi Y
  setTimeout(() => {
    if (targetId === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const el = document.querySelector(targetId);
    if (el) {
      const headerOffset = 80; // Jarak aman agar judul tidak tertutup navbar (dalam pixel)
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, 100);
};
</script>

<template>
  <div
    class="min-h-screen flex flex-col font-sans bg-slate-50 dark:bg-[#0e131f]"
  >
    <header
      class="sticky top-0 z-50 bg-white/90 dark:bg-[#121826]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 md:h-20">
          <div
            class="flex items-center gap-3 cursor-pointer"
            @click.prevent="scrollTo('#')"
          >
            <img
              src="/logo.png"
              alt="Logo"
              class="w-10 h-10 object-contain drop-shadow-sm"
            />
            <span
              class="font-bold text-lg md:text-xl text-slate-800 dark:text-white tracking-tight"
              >Masjid Nurul Huda</span
            >
          </div>

          <nav class="hidden lg:flex space-x-8">
            <a
              href="#"
              @click.prevent="scrollTo('#')"
              class="text-brand-green font-semibold flex items-center gap-2 text-sm"
              ><Home :size="16" /> Beranda</a
            >
            <a
              href="#profil"
              @click.prevent="scrollTo('#profil')"
              class="text-slate-500 hover:text-brand-green dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              ><Info :size="16" /> Profil</a
            >
            <a
              href="#kas"
              @click.prevent="scrollTo('#kas')"
              class="text-slate-500 hover:text-brand-green dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              ><HeartHandshake :size="16" /> Keuangan</a
            >
            <a
              href="#kabar"
              @click.prevent="scrollTo('#kabar')"
              class="text-slate-500 hover:text-brand-green dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              ><BookOpen :size="16" /> Kabar</a
            >
            <a
              href="#galeri"
              @click.prevent="scrollTo('#galeri')"
              class="text-slate-500 hover:text-brand-green dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              ><ImageIcon :size="16" /> Galeri</a
            >
          </nav>

          <div class="flex items-center gap-2 sm:gap-4">
            <button
              @click="toggleTheme"
              class="hidden lg:flex p-2 text-slate-500 hover:text-brand-green dark:text-slate-400 dark:hover:text-amber-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 active:scale-95"
              title="Ganti Tema"
            >
              <Moon v-if="!isDark" :size="18" />
              <Sun v-else :size="18" class="text-amber-500" />
            </button>
            <router-link
              to="/admin/login"
              class="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-brand-green dark:hover:text-brand-green transition-colors"
            >
              <LogIn :size="16" />
              <span>Portal Pengurus</span>
            </router-link>

            <button
              @click="toggleMobileMenu"
              class="lg:hidden p-2.5 text-slate-500 hover:text-brand-green dark:text-slate-400 rounded-xl focus:outline-none bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              <Menu v-if="!isMobileMenuOpen" :size="20" />
              <X v-else :size="20" />
            </button>
          </div>
        </div>
      </div>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <div
          v-if="isMobileMenuOpen"
          class="lg:hidden absolute w-full bg-white dark:bg-[#121826] border-b border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <nav class="px-4 pt-2 pb-6 flex flex-col space-y-2">
            <a
              href="#"
              @click.prevent="scrollTo('#')"
              class="px-4 py-3 text-brand-green bg-brand-green/10 rounded-lg font-bold flex items-center gap-3"
              ><Home :size="18" /> Beranda</a
            >
            <a
              href="#profil"
              @click.prevent="scrollTo('#profil')"
              class="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium flex items-center gap-3"
              ><Info :size="18" /> Profil Masjid</a
            >
            <a
              href="#kas"
              @click.prevent="scrollTo('#kas')"
              class="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium flex items-center gap-3"
              ><HeartHandshake :size="18" /> Transparansi Keuangan</a
            >
            <a
              href="#kabar"
              @click.prevent="scrollTo('#kabar')"
              class="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium flex items-center gap-3"
              ><BookOpen :size="18" /> Kabar & Agenda</a
            >
            <a
              href="#galeri"
              @click.prevent="scrollTo('#galeri')"
              class="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium flex items-center gap-3"
              ><ImageIcon :size="18" /> Galeri Dokumentasi</a
            >
            <a
              href="#saran"
              @click.prevent="scrollTo('#saran')"
              class="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium flex items-center gap-3"
              ><MessageSquare :size="18" /> Kritik & Saran</a
            >

            <div class="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
            <button
              @click="toggleTheme"
              class="px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium flex items-center gap-3 transition-colors"
            >
              <Moon v-if="!isDark" :size="18" />
              <Sun v-else :size="18" class="text-amber-500" />
              {{ isDark ? "Mode Terang" : "Mode Gelap" }}
            </button>
            <router-link
              @click="isMobileMenuOpen = false"
              to="/admin/login"
              class="px-4 py-3 text-brand-green font-bold flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogIn :size="18" /> Portal Pengurus
            </router-link>
          </nav>
        </div>
      </transition>
    </header>

    <main class="flex-grow">
      <router-view />
    </main>

    <footer
      class="bg-white dark:bg-[#121826] border-t border-slate-200 dark:border-slate-800 mt-20 pt-12 pb-8"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <div>
          <div
            class="flex items-center justify-center md:justify-start gap-3 mb-4"
          >
            <img
              src="/logo.png"
              alt="Logo"
              class="w-12 h-12 object-contain grayscale opacity-70"
            />
            <h3
              class="font-bold text-xl text-slate-800 dark:text-white tracking-tight"
            >
              Masjid Nurul Huda
            </h3>
          </div>
          <p
            class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto md:mx-0"
          >
            Membangun peradaban umat melalui pusat ibadah, pendidikan, dan
            pemberdayaan ekonomi syariah yang transparan dan amanah.
          </p>
        </div>
        <div>
          <h3 class="font-bold text-lg text-slate-800 dark:text-white mb-4">
            Kontak Kami
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Jl. Contoh Alamat No. 123<br />Kota Anda, Provinsi 12345
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Telp: (021) 123-4567<br />Email: info@nurulhuda.com
          </p>
        </div>
        <div>
          <h3 class="font-bold text-lg text-slate-800 dark:text-white mb-4">
            Layanan Digital
          </h3>
          <button
            class="px-6 py-3 bg-brand-green text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-green/20 hover:bg-brand-green/90 active:scale-95 transition-all w-full md:w-auto"
          >
            Salurkan Donasi
          </button>
        </div>
      </div>
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-100 dark:border-slate-800/50 text-center text-xs font-medium text-slate-400"
      >
        &copy; {{ new Date().getFullYear() }} Masjid Nurul Huda. All rights
        reserved.
      </div>
    </footer>
  </div>
</template>
