<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { pengaturanService as service, type PengaturanTab, type PengaturanFormState } from '@/services/admin/pengaturanService';
import { useAuthStore } from '@/stores/authStore';
const props = defineProps<{ resource: PengaturanTab; title: string }>();
const auth = useAuthStore();
type Row = { id: number; name: string; detail: string; flow?: PengaturanFormState['jenis_arus']; role?: PengaturanFormState['role']; active?: number };
const rows = ref<Row[]>([]); const loading = ref(false); const busy = ref(false);
const error = ref(''); const notice = ref(''); const search = ref(''); const editing = ref(false);
const editId = ref<number | null>(null); const pending = ref<Row | null>(null);
const nameInput = ref<HTMLInputElement>();
const form = reactive<PengaturanFormState>({ nama: '', jenis_arus: 'general', nama_pengurus_list: [''], role: 'pengurus', email: '', password: '' });
const filtered = computed(() => rows.value.filter(row => (row.name + ' ' + row.detail).toLocaleLowerCase('id-ID').includes(search.value.toLocaleLowerCase('id-ID'))));
async function load() {
  loading.value = true; error.value = '';
  try {
    if (props.resource === 'kategori') rows.value = (await service.getKategori()).map(r => ({ id: r.id, name: r.nama_kategori, detail: r.jenis_arus, flow: r.jenis_arus }));
    else if (props.resource === 'seksi') rows.value = (await service.getSeksi()).map(r => ({ id: r.id, name: r.nama_seksi, detail: r.nama_pengurus ?? '' }));
    else rows.value = (await service.getUsers()).map(r => ({ id: r.id, name: r.name, detail: r.email, role: r.role, active: r.is_active }));
  } catch (e) { error.value = e instanceof Error ? e.message : 'Data belum dapat dimuat.'; }
  finally { loading.value = false; }
}
async function edit(row?: Row) {
  editId.value = row?.id ?? null; error.value = ''; notice.value = ''; pending.value = null;
  Object.assign(form, { nama: row?.name ?? '', jenis_arus: row?.flow ?? 'general', nama_pengurus_list: props.resource === 'seksi' && row?.detail ? row.detail.split(',').map(n => n.trim()) : [''], role: row?.role ?? 'pengurus', email: props.resource === 'akun' ? row?.detail ?? '' : '', password: '' });
  editing.value = true; await nextTick(); nameInput.value?.focus();
}
async function save() {
  if (busy.value) return;
  busy.value = true; error.value = ''; notice.value = '';
  try {
    const result = await service.saveByTab({ tab: props.resource, editId: editId.value, form });
    editing.value = false; form.password = '';
    notice.value = result.shouldWarnRelogin ? 'Perubahan disimpan. Sesi akun yang diubah dicabut; pengguna perlu masuk kembali.' : 'Data berhasil disimpan.';
    if (props.resource === 'akun' && editId.value === auth.user?.id) await auth.checkAuth(true);
    await load();
  } catch (e) { error.value = e instanceof Error ? e.message : 'Data gagal disimpan.'; }
  finally { busy.value = false; }
}
async function confirmAction() {
  if (!pending.value || busy.value) return;
  busy.value = true; error.value = ''; notice.value = '';
  try {
    if (props.resource === 'akun') await service.setUserActive(pending.value.id, pending.value.active === 0);
    else await service.deleteByTab(props.resource, pending.value.id);
    pending.value = null; notice.value = 'Perubahan berhasil disimpan.'; await load();
  } catch (e) { error.value = e instanceof Error ? e.message : 'Perubahan gagal.'; }
  finally { busy.value = false; }
}
onMounted(load);
</script>
<template>
  <section>
    <h1>{{ title }}</h1>
    <p v-if="resource === 'akun'">Kelola identitas, peran, dan status akun. Perubahan akun dapat mencabut sesi aktif.</p>
    <p v-else-if="resource === 'seksi'">Kelola seksi penanggung jawab beserta nama pengurus.</p>
    <p v-else>Kelola kategori untuk mengelompokkan pemasukan dan pengeluaran.</p>
    <p><button :disabled="busy" @click="edit()">Tambah {{ resource }}</button></p>
    <p><label>Cari {{ resource }} <input v-model="search" type="search"></label></p>
    <p v-if="loading" role="status">Memuat data…</p>
    <p v-if="error" role="alert">{{ error }} <button :disabled="loading || busy" @click="load">Muat ulang</button></p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <form v-if="editing" @submit.prevent="save">
      <fieldset :disabled="busy"><legend>{{ editId === null ? 'Tambah' : 'Ubah' }} {{ resource }}</legend>
        <p><label>Nama<br><input ref="nameInput" v-model="form.nama" required maxlength="100"></label></p>
        <p v-if="resource === 'kategori'"><label>Jenis arus<br><select v-model="form.jenis_arus"><option value="general">Umum</option><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option></select></label></p>
        <fieldset v-if="resource === 'seksi'"><legend>Nama pengurus</legend>
          <p v-for="(_, index) in form.nama_pengurus_list" :key="index"><label>Pengurus {{ index + 1 }} <input v-model="form.nama_pengurus_list[index]"></label> <button type="button" @click="form.nama_pengurus_list.splice(index, 1)">Hapus nama {{ index + 1 }}</button></p>
          <button type="button" @click="form.nama_pengurus_list.push('')">Tambah nama pengurus</button>
        </fieldset>
        <template v-if="resource === 'akun'">
          <p><label>Email<br><input v-model="form.email" type="email" :readonly="editId !== null" required autocomplete="off"></label></p>
          <p><label>Peran<br><select v-model="form.role"><option value="pengurus">Pengurus</option><option value="bendahara">Bendahara</option><option value="ketua">Ketua</option><option value="superadmin">Superadmin</option></select></label></p>
          <p v-if="editId === null"><label>Password awal<br><input v-model="form.password" type="password" minlength="8" required autocomplete="new-password"></label></p>
        </template>
        <button type="submit">{{ busy ? 'Menyimpan…' : 'Simpan' }}</button> <button type="button" @click="editing = false; form.password = ''">Batal</button>
      </fieldset>
    </form>
    <section v-if="pending" aria-label="Konfirmasi perubahan">
      <h2>Konfirmasi {{ resource === 'akun' ? (pending.active === 0 ? 'aktivasi' : 'nonaktifkan akun') : 'hapus data' }}</h2>
      <p>{{ pending.name }} — {{ pending.detail }}</p>
      <p v-if="resource === 'akun' && pending.active !== 0">Akun akan dikeluarkan dari sesi aktif dan tidak dapat masuk kembali.</p>
      <button :disabled="busy" @click="confirmAction">Ya, lanjutkan</button> <button :disabled="busy" @click="pending = null">Batal</button>
    </section>
    <p v-if="!loading && !error && !filtered.length">{{ search ? 'Tidak ada hasil pencarian.' : 'Belum ada data.' }}</p>
    <ul v-else aria-label="Daftar data">
      <li v-for="row in filtered" :key="row.id">
        <h2>{{ row.name }}</h2><p>{{ row.detail || 'Belum ada nama pengurus.' }}</p>
        <p v-if="resource === 'akun'">Peran: {{ row.role }}. Status: {{ row.active ? 'Aktif' : 'Nonaktif' }}</p>
        <button :disabled="busy" @click="edit(row)">Ubah {{ row.name }}</button>
        <button :disabled="busy || (resource === 'akun' && row.id === auth.user?.id)" @click="pending = row; editing = false; error = ''">{{ resource === 'akun' ? (row.active ? 'Nonaktifkan' : 'Aktifkan') : 'Hapus' }} {{ row.name }}</button>
      </li>
    </ul>
  </section>
</template>
