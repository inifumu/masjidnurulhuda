<script setup lang="ts">
import HeroSection from "../../components/public/home/HeroSection.vue";
import JadwalSholat from "../../components/public/home/JadwalSholat.vue";
import KasWidget from "../../components/public/home/KasWidget.vue";
import KabarMasjid from "../../components/public/home/KabarMasjid.vue";
import GaleriWidget from "../../components/public/home/GaleriWidget.vue";
import KritikSaran from "../../components/public/home/KritikSaran.vue";

// 🟢 CUSTOM DIRECTIVE UNTUK ANIMASI SCROLL (FADE IN UP)
const vFade = {
  mounted: (el: HTMLElement) => {
    el.classList.add(
      "opacity-0",
      "translate-y-8",
      "transition-all",
      "duration-[800ms]",
      "ease-out",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.remove("opacity-0", "translate-y-8");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
  },
};
</script>

<template>
  <div class="scroll-smooth">
    <section class="relative bg-brand-green overflow-hidden pt-20 pb-32">
      <div
        class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"
      ></div>
      <div v-fade>
        <HeroSection />
      </div>
    </section>

    <section
      class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10"
      v-fade
    >
      <JadwalSholat />
    </section>

    <section
      id="kas"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
      v-fade
    >
      <KasWidget />
    </section>

    <section
      id="kabar"
      class="bg-slate-100/50 dark:bg-[#121826]/50 py-24 border-y border-slate-200 dark:border-slate-800"
      v-fade
    >
      <KabarMasjid />
    </section>

    <section
      id="galeri"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
      v-fade
    >
      <GaleriWidget />
    </section>

    <section
      id="saran"
      class="bg-brand-green/5 dark:bg-brand-green/5 py-24 border-t border-brand-green/10"
      v-fade
    >
      <KritikSaran />
    </section>
  </div>
</template>
