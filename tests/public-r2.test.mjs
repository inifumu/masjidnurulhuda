import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("R2 public shell tidak memuat data contoh atau dead operational CTA", async () => {
  const layout = await read("src/layouts/PublicLayout.vue");
  const hero = await read("src/components/public/home/HeroSection.vue");
  for (const forbidden of ["Jl. Contoh", "123-4567", "info@nurulhuda.com", "Salurkan Donasi", 'href="#"']) {
    assert.equal(`${layout}\n${hero}`.includes(forbidden), false, `residu tidak boleh ada: ${forbidden}`);
  }
  assert.match(layout, /aria-label="Navigasi utama"/);
  assert.match(layout, /event\.key === "Escape"/);
  assert.match(layout, /firstMobileLink\.value\?\.focus/);
});

test("R2 public data sections memiliki state jujur dan retry", async () => {
  const [jadwal, kas, kabar, galeri, saran] = await Promise.all([
    read("src/components/public/home/JadwalSholat.vue"), read("src/components/public/home/KasWidget.vue"),
    read("src/components/public/home/KabarMasjid.vue"), read("src/components/public/home/GaleriWidget.vue"),
    read("src/components/public/home/KritikSaran.vue"),
  ]);
  assert.match(jadwal, /source === 'stale'/);
  assert.match(jadwal, /@retry="loadJadwal"/);
  assert.match(kas, /@retry="loadKas"/);
  assert.match(kabar, /Belum ada kabar yang diterbitkan/);
  assert.match(galeri, /Belum ada dokumentasi publik/);
  assert.match(saran, /Kanal masukan belum tersedia/);
  for (const source of [kabar, galeri, saran]) assert.doesNotMatch(source, /backdrop-blur|Coming Soon|Fitur Terkunci/);
});
