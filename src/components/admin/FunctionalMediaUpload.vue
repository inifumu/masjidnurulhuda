<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useMediaUpload } from '@/composables/admin/useMediaUpload';
import type { MediaUsageCategory } from '@/services/admin/mediaService';
const emit = defineEmits<{ uploaded: [] }>();
const { queue, isUploading, addFiles, uploadAll, retryItem, removeItem, clearQueue } = useMediaUpload();
const category = ref<MediaUsageCategory>('general'); const processing = ref(false);
const retrying = ref(false);
async function selectFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  processing.value = true;
  try { await addFiles(Array.from(input.files ?? []), category.value); }
  finally { processing.value = false; input.value = ''; }
}
async function upload() { await uploadAll(); emit('uploaded'); }
async function retry(id: string) {
  if (retrying.value || isUploading.value) return;
  retrying.value = true;
  try { await retryItem(id); emit('uploaded'); }
  finally { retrying.value = false; }
}
onBeforeUnmount(clearQueue);
</script>
<template>
  <section>
    <h2>Unggah media</h2>
    <p>Gambar diproses beserta thumbnail sebelum dikirim. Periksa status setiap file.</p>
    <fieldset :disabled="isUploading || processing || retrying"><legend>Pilih gambar</legend>
      <p><label>Kategori penggunaan <select v-model="category"><option value="general">Umum</option><option value="artikel">Artikel</option><option value="profil">Profil</option><option value="galeri">Galeri</option></select></label></p>
      <p><label>File gambar <input type="file" accept="image/jpeg,image/png,image/webp" multiple @change="selectFiles"></label></p>
    </fieldset>
    <p v-if="processing" role="status">Memproses gambar…</p>
    <ul><li v-for="item in queue" :key="item.localId">
      <p><strong>{{ item.sourceFile.name }}</strong> — {{ item.status }} ({{ item.progress }}%)</p>
      <p><label>Teks alternatif <input v-model="item.alt_text" :disabled="isUploading || item.status === 'success'"></label></p>
      <p v-if="item.errorMessage" role="alert">{{ item.errorMessage }}</p>
      <button v-if="item.status === 'failed'" :disabled="isUploading || processing || retrying" @click="retry(item.localId)">Coba lagi</button>
      <button :disabled="isUploading || processing || retrying" @click="removeItem(item.localId)">Keluarkan dari antrean</button>
    </li></ul>
    <button :disabled="isUploading || processing || retrying || !queue.some(item => item.status === 'ready')" @click="upload">{{ isUploading ? 'Mengunggah…' : 'Unggah file siap' }}</button>
  </section>
</template>
