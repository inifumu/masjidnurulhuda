<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useKas } from '@/composables/admin/useKas';
import { ApiError } from '@/services/httpClient';
import { parseDirectTransaction, parseProposalTransaction } from '../../../shared/contracts';
const props = defineProps<{ proposal?: boolean }>();
const kas = useKas();
const { formInput, formProposal, sections, methods, filteredCategoriesInput, filteredCategoriesProposal, isLoading, isLoadingData, loadError } = kas;
const form = computed(() => props.proposal ? formProposal.value : formInput.value);
const categories = computed(() => props.proposal ? filteredCategoriesProposal.value : filteredCategoriesInput.value);
const fields = ref<Record<string, string>>({}); const error = ref(''); const notice = ref(''); const element = ref<HTMLFormElement>();
async function focusError() { await nextTick(); element.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); }
async function submit() {
  if (isLoading.value) return;
  fields.value = {}; error.value = ''; notice.value = '';
  if (!/^\d+(?:\.\d{3})*$/.test(form.value.jumlah.trim())) {
    fields.value = { jumlah: 'Masukkan rupiah utuh positif, misalnya 50000 atau 50.000.' };
    await focusError(); return;
  }
  const parsed = (props.proposal ? parseProposalTransaction : parseDirectTransaction)({ ...form.value, jumlah: kas.parseInputRupiah(form.value.jumlah) });
  if (!parsed.ok) { fields.value = parsed.fields; await focusError(); return; }
  try {
    if (props.proposal) await kas.handleProposal(); else await kas.handleDirectInput();
    notice.value = props.proposal ? 'Proposal diajukan. Menunggu persetujuan ketua.' : 'Transaksi berhasil dicatat ke kas.';
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Penyimpanan gagal.';
    if (e instanceof ApiError) {
      fields.value = e.fields;
      if (e.status === 409) await kas.loadData().catch(() => undefined);
    }
    await focusError();
  }
}
</script>
<template>
  <p v-if="isLoadingData" role="status">Memuat kategori dan seksi…</p>
  <p v-if="loadError" role="alert">{{ loadError }} <button @click="kas.loadData().catch(() => undefined)">Coba lagi</button></p>
  <form ref="element" novalidate @submit.prevent="submit">
    <fieldset :disabled="isLoading || isLoadingData || !!loadError"><legend>{{ proposal ? 'Pengajuan dana' : 'Transaksi langsung' }}</legend>
      <p><label for="cash-tipe">Arus kas</label><br><select id="cash-tipe" v-model="form.tipe"><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option></select></p>
      <p><label for="cash-jumlah">Jumlah (rupiah)</label><br><input id="cash-jumlah" v-model="form.jumlah" inputmode="numeric" :aria-invalid="!!fields.jumlah" aria-describedby="error-jumlah"><br><span id="error-jumlah">{{ fields.jumlah }}</span></p>
      <p><label for="cash-keperluan">Keperluan</label><br><input id="cash-keperluan" v-model="form.keperluan" maxlength="120" :aria-invalid="!!fields.keperluan" aria-describedby="error-keperluan"><br><span id="error-keperluan">{{ fields.keperluan }}</span></p>
      <p><label for="cash-tanggal">Tanggal</label><br><input id="cash-tanggal" v-model="form.tanggal" type="date" :aria-invalid="!!fields.tanggal" aria-describedby="error-tanggal"><br><span id="error-tanggal">{{ fields.tanggal }}</span></p>
      <p><label for="cash-kategori">Kategori</label><br><select id="cash-kategori" v-model="form.kategori_id" :aria-invalid="!!fields.kategori_id" aria-describedby="error-kategori"><option :value="null">Pilih kategori</option><option v-for="item in categories" :key="item.id" :value="item.id">{{ item.nama_kategori }}</option></select><br><span id="error-kategori">{{ fields.kategori_id }}</span></p>
      <p><label for="cash-seksi">Seksi {{ proposal ? '(wajib)' : '(opsional)' }}</label><br><select id="cash-seksi" v-model="form.seksi_id" :aria-invalid="!!fields.seksi_id" aria-describedby="error-seksi"><option :value="null">Pilih seksi</option><option v-for="item in sections" :key="item.id" :value="item.id">{{ item.nama_seksi }}</option></select><br><span id="error-seksi">{{ fields.seksi_id }}</span></p>
      <p><label for="cash-metode">Metode</label><br><select id="cash-metode" v-model="form.metode"><option v-for="item in methods" :key="item.id" :value="item.id">{{ item.name }}</option></select></p>
      <p><label for="cash-keterangan">{{ proposal ? 'Rincian pengajuan' : 'Keterangan tambahan (opsional)' }}</label><br><textarea id="cash-keterangan" v-model="form.keterangan" rows="4" cols="25" :maxlength="proposal ? 2000 : 1000" :aria-invalid="!!fields.keterangan" aria-describedby="error-keterangan"/><br><span id="error-keterangan">{{ fields.keterangan }}</span></p>
      <button type="submit">{{ isLoading ? 'Menyimpan…' : proposal ? 'Ajukan proposal' : 'Catat transaksi' }}</button>
    </fieldset>
    <p v-if="error" role="alert">{{ error }}</p><p v-if="notice" role="status">{{ notice }}</p>
  </form>
</template>
