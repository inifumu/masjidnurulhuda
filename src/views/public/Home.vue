<script setup lang="ts">
import HeroSection from "../../components/public/home/HeroSection.vue";
import JadwalSholat from "../../components/public/home/JadwalSholat.vue";
import KasWidget from "../../components/public/home/KasWidget.vue";
import KabarMasjid from "../../components/public/home/KabarMasjid.vue";
import GaleriWidget from "../../components/public/home/GaleriWidget.vue";
import KritikSaran from "../../components/public/home/KritikSaran.vue";
</script>
<template><div><section id="profil" class="scroll-mt-20 bg-[var(--brand-emerald-deep)]"><HeroSection /></section><section id="jadwal" class="scroll-mt-20"><JadwalSholat /></section><section id="kas" class="scroll-mt-20 bg-card"><KasWidget /></section><section id="kabar" class="scroll-mt-20"><KabarMasjid /></section><section id="galeri" class="scroll-mt-20 border-t bg-card"><GaleriWidget /></section><section id="saran" class="scroll-mt-20 border-t"><KritikSaran /></section></div></template>
