<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FunctionalMediaNavigation from '@/components/admin/FunctionalMediaNavigation.vue';
import { mediaService, type MediaItem } from '@/services/admin/mediaService';
const items = ref<MediaItem[]>([]); const selected = ref<MediaItem[]>([]); const loading = ref(false); const error = ref(''); const page = ref(1); const total = ref(0);
async function load(target = 1) { loading.value = true; error.value = ''; try { const result = await mediaService.listMedia({ page: target, limit: 12 }); items.value = result.items; total.value = result.total; page.value = result.page; } catch(e) { error.value = e instanceof Error ? e.message : 'Media gagal dimuat.'; } finally { loading.value = false; } }
function toggle(item: MediaItem) { if(selected.value.some(row => row.id === item.id)) selected.value = selected.value.filter(row => row.id !== item.id); else selected.value.push(item); }
onMounted(() => load());
</script>
<template>
  <FunctionalMediaNavigation />
  <section><h1>Galeri &amp; dokumentasi</h1>
    <p>Fungsi tersedia: memilih media untuk meninjau susunan galeri. Pilihan hanya disimpan selama halaman ini terbuka, belum tersimpan atau terbit di website.</p>
    <h2>Media terpilih ({{ selected.length }})</h2><p v-if="!selected.length">Belum ada media dipilih.</p>
    <ul><li v-for="item in selected" :key="item.id">#{{ item.id }} — {{ item.alt_text || 'Tanpa deskripsi' }} <button @click="toggle(item)">Keluarkan #{{ item.id }}</button></li></ul>
    <h2>Pilih media</h2><p v-if="loading" role="status">Memuat media…</p><p v-if="error" role="alert">{{ error }} <button @click="load(page)">Coba lagi</button></p>
    <ul v-if="!loading"><li v-for="item in items" :key="item.id"><label><input type="checkbox" :checked="selected.some(row => row.id === item.id)" @change="toggle(item)">Media #{{ item.id }} — {{ item.alt_text || 'Tanpa deskripsi' }}</label> <a :href="item.file_url" target="_blank" rel="noopener">Lihat gambar</a></li></ul>
    <p>Halaman {{ page }} · {{ total }} media</p><button :disabled="loading || page <= 1" @click="load(page - 1)">Sebelumnya</button> <button :disabled="loading || page * 12 >= total" @click="load(page + 1)">Berikutnya</button>
  </section>
</template>
