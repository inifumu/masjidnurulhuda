<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FunctionalMediaUpload from '@/components/admin/FunctionalMediaUpload.vue';
import FunctionalMediaNavigation from '@/components/admin/FunctionalMediaNavigation.vue';
import { mediaService, type MediaItem } from '@/services/admin/mediaService';
const items = ref<MediaItem[]>([]); const page = ref(1); const total = ref(0);
const loading = ref(false); const busy = ref(false); const error = ref(''); const notice = ref('');
const editing = ref<MediaItem | null>(null); const alt = ref(''); const pending = ref<MediaItem | null>(null);
let sequence = 0;
function imageError(event: Event, item: MediaItem) {
  const image = event.target as HTMLImageElement;
  if (image.src !== new URL(item.file_url, location.origin).href) image.src = item.file_url;
}
async function load(target = page.value) {
  const request = ++sequence; loading.value = true; error.value = '';
  try { const result = await mediaService.listMedia({ page: target, limit: 12 }); if(request === sequence) { items.value = result.items; total.value = result.total; page.value = result.page; } }
  catch(e) { if(request === sequence) error.value = e instanceof Error ? e.message : 'Media gagal dimuat.'; }
  finally { if(request === sequence) loading.value = false; }
}
async function saveAlt() {
  if(!editing.value || busy.value) return; busy.value = true; error.value = ''; notice.value = '';
  try { await mediaService.updateMediaMetadata(editing.value.id, { alt_text: alt.value }); editing.value = null; notice.value = 'Teks alternatif disimpan.'; await load(); }
  catch(e) { error.value = e instanceof Error ? e.message : 'Perubahan gagal.'; } finally { busy.value = false; }
}
async function remove() {
  if(!pending.value || busy.value) return; busy.value = true; error.value = ''; notice.value = '';
  try { await mediaService.deleteMedia(pending.value.id); pending.value = null; notice.value = 'Permintaan penghapusan diterima. Pembersihan file diproses oleh server.'; await load(items.value.length === 1 && page.value > 1 ? page.value - 1 : page.value); }
  catch(e) { error.value = e instanceof Error ? e.message : 'Media gagal dihapus.'; } finally { busy.value = false; }
}
async function copy(item: MediaItem) {
  try { await navigator.clipboard.writeText(new URL(item.file_url, location.origin).href); notice.value = 'URL disalin.'; }
  catch { error.value = 'Tidak dapat menyalin. Gunakan tautan Buka gambar.'; }
}
onMounted(() => load());
</script>
<template>
  <FunctionalMediaNavigation />
  <section><h1>Pustaka media</h1>
    <FunctionalMediaUpload @uploaded="load(1)" />
    <h2>Media tersimpan</h2>
    <button :disabled="loading" @click="load()">Muat ulang</button>
    <p v-if="loading" role="status">Memuat media…</p><p v-if="error" role="alert">{{ error }}</p><p v-if="notice" role="status">{{ notice }}</p>
    <form v-if="editing" @submit.prevent="saveAlt"><fieldset :disabled="busy"><legend>Ubah teks alternatif media #{{ editing.id }}</legend><p><label>Deskripsi gambar<br><textarea v-model="alt" cols="25" rows="3" maxlength="500" /></label></p><button type="submit">Simpan</button> <button type="button" @click="editing = null">Batal</button></fieldset></form>
    <section v-if="pending" aria-label="Konfirmasi hapus media"><h2>Hapus media #{{ pending.id }}?</h2><p>{{ pending.alt_text || 'Gambar tanpa deskripsi' }}. Media yang masih dipakai dapat ditolak oleh server.</p><button :disabled="busy" @click="remove">Ya, hapus media</button> <button :disabled="busy" @click="pending = null">Batal</button></section>
    <template v-if="!loading && !error">
      <p v-if="!items.length">Belum ada media.</p>
      <ul><li v-for="item in items" :key="item.id">
        <h3>Media #{{ item.id }}</h3>
        <img :src="item.thumb_url || item.file_url" :alt="item.alt_text || 'Gambar tanpa deskripsi'" width="120" loading="lazy" @error="imageError($event, item)">
        <p>{{ item.alt_text || 'Belum ada teks alternatif.' }}</p><p>{{ item.kategori_penggunaan }} · {{ item.mime_type }} · {{ item.size_bytes }} byte</p>
        <p><a :href="item.file_url" target="_blank" rel="noopener">Buka gambar #{{ item.id }}</a></p>
        <button @click="copy(item)">Salin URL #{{ item.id }}</button>
        <button :disabled="busy" @click="editing = item; alt = item.alt_text || ''; pending = null">Ubah teks alternatif #{{ item.id }}</button>
        <button :disabled="busy" @click="pending = item; editing = null">Hapus media #{{ item.id }}</button>
      </li></ul>
    </template>
    <p>Halaman {{ page }} · {{ total }} media</p><button :disabled="loading || page <= 1" @click="load(page - 1)">Sebelumnya</button> <button :disabled="loading || page * 12 >= total" @click="load(page + 1)">Berikutnya</button>
  </section>
</template>
