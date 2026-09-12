import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.P05_BROWSER_BASE_URL || 'http://127.0.0.1:4173';
const evidence = '.hermes/artifacts/admin-functional-reset';
await mkdir(evidence, { recursive: true });
const date = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
const roles = ['superadmin','ketua','bendahara','pengurus'];
const makeTx = (id, status = 'approved') => ({ id, status, tipe: 'pengeluaran', jumlah: 50000, keperluan: 'Kebutuhan operasional masjid', keterangan: 'Rincian kebutuhan operasional', tanggal: date, kategori_id: 1, kategori: 'Operasional', seksi_id: 1, seksi: 'Pengurus' });
async function fixture(page, role = 'superadmin') {
  const state = { role, authenticated: true, authFailure: false, listFailure: false, timelineFailure: false, attempts: [], failures: [], mutateDelay: 0,
    rows: [makeTx(1), makeTx(2, 'pending_ketua'), makeTx(3,'pending_bendahara')],
    categories: [{ id: 1, nama_kategori: 'Operasional', jenis_arus: 'general' }],
    sections: [{ id: 1, nama_seksi: 'Pengurus', nama_pengurus: 'Pengurus Satu' }],
    users: [{ id: 1, name: 'Admin', email: 'admin@example.test', role: 'superadmin', is_active: 1 }, { id: 2, name: 'Bendahara', email: 'bendahara@example.test', role: 'bendahara', is_active: 1 }],
    media: [{ id: 1, file_url: '/test-image.png', thumb_url: '/test-image.png', storage_key: 'media/test.png', alt_text: 'Foto masjid', kategori_penggunaan: 'general', mime_type: 'image/png', size_bytes: 100, width: 1, height: 1 }],
    calls: [], impersonation: null };
  await page.route('**/test-image.png', r => r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=','base64') }));
  await page.route('**/api/**', async r => {
    const req = r.request(), url = new URL(req.url()), p = url.pathname, method = req.method();
    state.calls.push({ path: p, method, query: url.search });
    const json = (status, data) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    const ok = data => json(200, { status: 'success', data });
    const fail = (status, message) => json(status, { status: 'error', message, error: { code: status === 409 ? 'CONFLICT' : 'INTERNAL_ERROR' } });
    if(p.endsWith('/auth/me')) return state.authFailure ? fail(503,'Sesi gagal dimuat') : !state.authenticated ? fail(401,'Masuk dahulu') : ok({ id: 1, name: 'Admin', role: state.role, impersonation: state.impersonation });
    if(p.endsWith('/auth/login')) { const n = state.failures.shift(); if(n) return fail(n,'Login gagal'); state.authenticated = true; return ok({ id: 1, name: 'Admin', role: state.role }); }
    if(p.endsWith('/auth/logout')) { state.authenticated = false; return ok({}); }
    if(p.endsWith('/auth/impersonation/start')) { state.role = req.postDataJSON().role; state.impersonation = { active: true, role: state.role, original_role: 'superadmin', actor_id: 1, actor_name: 'Admin', expires_at: Math.floor(Date.now()/1000)+600 }; return ok({}); }
    if(p.endsWith('/auth/impersonation/stop')) { state.role = 'superadmin'; state.impersonation = null; return ok({}); }
    if(p.endsWith('/dashboard/summary')) return ok({ saldoAwal: 100000, totalPemasukan: 0, totalPengeluaran: state.rows.filter(r => r.status === 'approved').reduce((sum,r) => sum+r.jumlah,0), saldoAkhir: 50000 });
    if(p.endsWith('/transaction/master-data')) return ok({ categories: state.categories, sections: state.sections });
    if(p.endsWith('/transaction/list')) {
      if(state.listFailure) return fail(503,'Transaksi tidak dapat dimuat');
      return ok(state.rows.filter(t => (!url.searchParams.get('tipe') || t.tipe === url.searchParams.get('tipe'))));
    }
    if(p.endsWith('/transaction/pending')) return ok(state.rows.filter(t => t.status.startsWith('pending')));
    if(p.endsWith('/timeline')) {
      if(state.timelineFailure) return fail(503,'Riwayat tidak tersedia');
      return ok({ history_available: true, events: [{ id: 1, event_type: 'created', from_status: null, to_status: 'approved', actor_name: 'Admin', created_at: '2026-09-12 00:00:00', reason: null }] });
    }
    if(p.includes('/transaction/') && method === 'POST') {
      const payload = req.postDataJSON(); state.attempts.push({ path: p, key: req.headers()['idempotency-key'], payload });
      if(state.mutateDelay) await new Promise(resolve => setTimeout(resolve,state.mutateDelay));
      const failure = state.failures.shift(); if(failure) return fail(failure, failure === 409 ? 'Status transaksi telah berubah.' : 'Layanan sementara gagal.');
      if(p.endsWith('add-direct') || p.endsWith('add-proposal')) state.rows.push({ ...makeTx(10 + state.rows.length), ...payload, status: p.endsWith('add-direct') ? 'approved' : 'pending_ketua' });
      else { const id = Number(p.match(/\d+/)?.[0]); const row = state.rows.find(t => t.id === id); if(row) row.status = p.endsWith('/void') ? 'void' : payload.action === 'reject' ? 'rejected' : row.status === 'pending_ketua' ? 'pending_bendahara' : 'approved'; }
      return ok({});
    }
    if(p.includes('/pengaturan/')) {
      const type = p.includes('/kategori') ? 'categories' : p.includes('/seksi') ? 'sections' : 'users';
      if(method === 'GET') return ok(state[type]);
      const id = Number(p.match(/\d+/)?.[0]); const body = method === 'DELETE' ? {} : req.postDataJSON();
      if(method === 'POST') state[type].push({ id: 10, ...body, is_active: 1 });
      if(method === 'PUT') Object.assign(state[type].find(row => row.id === id), body);
      if(method === 'DELETE') state[type] = state[type].filter(row => row.id !== id);
      return ok({});
    }
    if(p.includes('/admin/media')) {
      if(method === 'GET') return ok({ items: state.media, total: state.media.length, page: Number(url.searchParams.get('page') || 1), limit: 12 });
      if(method === 'PATCH') { Object.assign(state.media[0],req.postDataJSON()); return ok(state.media[0]); }
      if(method === 'DELETE') state.media = [];
      if(method === 'POST') {
        if(state.mediaFailure) { state.mediaFailure--; return fail(503, 'Upload sementara gagal.'); }
        return ok({ ...state.media[0], id: 2 });
      }
      return ok({});
    }
    if(p.startsWith('/api/public/')) return ok({});
    return fail(404, 'Unmapped test API: ' + p);
  });
  return state;
}
async function plain(page, label) {
  const result = await page.evaluate(() => ({ styles: document.styleSheets.length, inline: document.querySelectorAll('[style]').length, width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert.equal(result.styles,0,label + ': no CSS loaded');
  assert.equal(result.inline,0,label + ': no inline style');
  assert.ok(result.scroll <= result.width + 1, label + ': horizontal overflow ' + JSON.stringify(result));
}
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for(const width of [360,768,1366]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(); page.setDefaultTimeout(7000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const state = await fixture(page);
    const paths = ['dashboard','pengaturan/kategori-kas','pengaturan/seksi-pengurus','pengaturan/akun-akses','finance/transaksi','finance/transaksi-langsung','finance/proposal','finance/persetujuan','finance/riwayat-audit','media','galeri-dokumentasi','publikasi/kabar-masjid','publikasi/kegiatan','publikasi/kritik-saran'];
    for(const path of paths) { await page.goto(base+'/admin/'+path); await page.locator('main h1').waitFor(); await plain(page, path+' '+width); }
    await page.goto(base+'/admin/finance/transaksi-langsung');
    await page.getByRole('button',{name:'Catat transaksi',exact:true}).waitFor();
    await page.getByRole('button',{name:'Catat transaksi',exact:true}).click();
    assert.equal(await page.locator('#cash-jumlah').getAttribute('aria-invalid'),'true');
    assert.equal(await page.evaluate(() => document.activeElement.id),'cash-jumlah');
    await page.getByLabel('Jumlah (rupiah)').fill('50000'); await page.getByLabel('Keperluan',{exact:true}).fill('Pembayaran operasional'); await page.getByLabel('Kategori',{exact:true}).selectOption('1');
    state.failures = [409,503]; state.mutateDelay = 100;
    for(let attempt=0;attempt<3;attempt++) {
      await page.getByRole('button',{name:'Catat transaksi',exact:true}).click();
      if(attempt<2) await page.getByRole('alert').filter({hasText: attempt===0?'Status transaksi':'Layanan sementara'}).waitFor();
      else await page.getByText('Transaksi berhasil dicatat ke kas.',{exact:true}).waitFor();
    }
    assert.equal(state.attempts.length,3); assert.ok(state.attempts[0].key); assert.equal(new Set(state.attempts.map(a => a.key)).size,1);
    await page.goto(base+'/admin/finance/proposal'); await page.getByText('Ajukan proposal baru',{exact:true}).click();
    await page.getByLabel('Jumlah (rupiah)').fill('60000'); await page.getByLabel('Keperluan',{exact:true}).fill('Pengajuan kebutuhan seksi'); await page.getByLabel('Kategori',{exact:true}).selectOption('1'); await page.getByLabel('Seksi (wajib)').selectOption('1'); await page.getByLabel('Rincian pengajuan').fill('Rincian pengajuan kegiatan seksi masjid'); await page.getByRole('button',{name:'Ajukan proposal',exact:true}).click(); await page.getByText('Proposal diajukan. Menunggu persetujuan ketua.').waitFor();
    await page.goto(base+'/admin/finance/persetujuan');
    await page.getByRole('button',{name:'Setujui #2',exact:true}).click();
    state.failures=[409]; await page.getByRole('button',{name:'Ya, setujui',exact:true}).click(); await page.getByText('Status transaksi telah berubah.',{exact:true}).waitFor(); assert.equal(state.rows.find(t=>t.id===2).status,'pending_ketua');
    await page.getByRole('button',{name:'Ya, setujui',exact:true}).click(); await page.getByText('Perubahan berhasil disimpan.',{exact:true}).waitFor(); assert.equal(state.rows.find(t=>t.id===2).status,'pending_bendahara');
    await page.getByRole('button',{name:'Tolak #3',exact:true}).click(); await page.getByLabel('Alasan (10–500 karakter)').fill('Pengajuan perlu diperbaiki'); await page.getByRole('button',{name:'Ya, tolak',exact:true}).click(); await page.getByText('Perubahan berhasil disimpan.',{exact:true}).waitFor(); assert.equal(state.rows.find(t=>t.id===3).status,'rejected');
    await page.goto(base+'/admin/finance/transaksi');
    state.timelineFailure=true; await page.getByRole('button',{name:'Detail dan audit #1',exact:true}).click(); await page.getByRole('button',{name:'Coba lagi',exact:true}).click(); state.timelineFailure=false; await page.getByRole('button',{name:'Coba lagi',exact:true}).click(); await page.getByText(/created: Awal/).waitFor();
    await page.getByRole('button',{name:'Batalkan transaksi #1',exact:true}).click(); await page.getByLabel('Alasan (10–500 karakter)').fill('Pembatalan karena koreksi data'); await page.getByRole('button',{name:'Ya, batalkan transaksi',exact:true}).click(); await page.getByText('Perubahan berhasil disimpan.',{exact:true}).waitFor(); assert.equal(state.rows.find(t=>t.id===1).status,'void');
    await Promise.all([page.waitForResponse(r => r.url().includes('tipe=pemasukan')), page.getByLabel(/Arus kas/).selectOption('pemasukan')]);
    await page.getByRole('heading',{name: /Pembayaran operasional/}).waitFor(); assert.ok(state.calls.some(c=>c.query.includes('tipe=pemasukan')));
    await page.goto(base+'/admin/pengaturan/kategori-kas'); await page.getByRole('button',{name:'Tambah kategori',exact:true}).click(); await page.getByLabel('Nama',{exact:true}).fill('Kategori baru'); await page.getByRole('button',{name:'Simpan',exact:true}).click(); await page.getByRole('heading',{name:'Kategori baru',exact:true}).waitFor();
    await page.getByRole('button',{name:'Ubah Kategori baru',exact:true}).click(); await page.getByLabel('Nama',{exact:true}).fill('Kategori revisi'); await page.getByRole('button',{name:'Simpan',exact:true}).click(); await page.getByRole('heading',{name:'Kategori revisi',exact:true}).waitFor();
    await page.getByRole('button',{name:'Hapus Kategori revisi',exact:true}).click(); await page.getByRole('button',{name:'Ya, lanjutkan',exact:true}).click(); await page.getByRole('heading',{name:'Kategori revisi',exact:true}).waitFor({state:'hidden'});
    await page.goto(base+'/admin/pengaturan/akun-akses'); await page.getByRole('button',{name:'Nonaktifkan Bendahara',exact:true}).click(); await page.getByRole('button',{name:'Ya, lanjutkan',exact:true}).click(); await page.getByRole('button',{name:'Aktifkan Bendahara',exact:true}).waitFor();
    await page.goto(base+'/admin/media'); await page.getByRole('button',{name:'Ubah teks alternatif #1',exact:true}).click(); await page.getByLabel('Deskripsi gambar',{exact:true}).fill('Foto halaman masjid'); await page.getByRole('button',{name:'Simpan',exact:true}).click(); await page.getByText('Foto halaman masjid',{exact:true}).waitFor().catch(async e => { console.log(JSON.stringify({media: state.media, body: await page.locator('body').innerText()})); throw e; }); await plain(page,'media actions '+width);
    await page.getByRole('button',{name:'Hapus media #1',exact:true}).click(); await page.getByRole('button',{name:'Ya, hapus media',exact:true}).click(); await page.getByText('Belum ada media.',{exact:true}).waitFor();
    await page.goto(base+'/admin/dashboard'); await page.screenshot({path: evidence+'/dashboard-'+width+'.png',fullPage:true});
    await page.getByRole('link',{name:'Keuangan',exact:true}).click(); await page.locator('main h1').waitFor(); await plain(page,'SPA navigation '+width);
    assert.deepEqual(errors,[]); report.push({width,pages:paths.length,css:'none',transactions:'retry/proposal/approve/reject/void/audit',settings:'CRUD/status',media:'metadata/delete',errors}); await context.close();
  }
  for(const role of roles) {
    const context = await browser.newContext(); const page = await context.newPage(); const state = await fixture(page,role);
    await page.goto(base+'/admin/dashboard'); await page.locator('main h1').waitFor();
    assert.equal(await page.getByRole('link',{name:'Pengaturan',exact:true}).count(),['superadmin','ketua'].includes(role)?1:0);
    await page.goto(base+'/admin/pengaturan/akun-akses'); await page.locator('main h1').waitFor(); assert.equal(new URL(page.url()).pathname,role==='superadmin'?'/admin/pengaturan/akun-akses':'/admin/dashboard');
    await page.goto(base+'/admin/finance/persetujuan'); await page.locator('main h1').waitFor();
    if(role==='pengurus') assert.equal(new URL(page.url()).pathname,'/admin/dashboard');
    else { assert.equal(await page.getByRole('button',{name:'Setujui #2',exact:true}).count(),role==='bendahara'?0:1); assert.equal(await page.getByRole('button',{name:'Setujui #3',exact:true}).count(),role==='ketua'?0:1); }
    state.authFailure=true; await page.goto(base+'/admin/dashboard'); await page.getByRole('heading',{name:'Sesi belum dapat diverifikasi'}).waitFor(); assert.ok(!page.url().endsWith('/login')); state.authFailure=false; await page.getByRole('button',{name:'Coba lagi',exact:true}).click(); await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor();
    await context.close();
  }
  const context = await browser.newContext(); const page = await context.newPage(); const state = await fixture(page); state.authenticated=false;
  await page.goto(base+'/admin/login'); await page.getByLabel('Email',{exact:true}).fill('admin@example.test'); await page.getByLabel('Password',{exact:true}).fill('secret123');
  for(const status of [401,429,503]) { state.failures=[status]; await page.getByRole('button',{name:'Masuk',exact:true}).click(); await page.getByRole('alert').waitFor(); assert.match(await page.getByRole('alert').innerText(),status===401?/tidak sesuai/:status===429?/Terlalu banyak/:/belum dapat dijangkau/); }
  await page.getByRole('button',{name:'Masuk',exact:true}).click(); await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor();
  await page.getByText('Pratinjau akses',{exact:true}).click(); await page.getByRole('button',{name:'Mulai pratinjau',exact:true}).click(); await page.locator('[data-impersonation-banner]').waitFor(); assert.equal(state.role,'pengurus'); await page.getByRole('button',{name:'Kembali ke superadmin',exact:true}).click(); await page.locator('[data-impersonation-banner]').waitFor({state:'hidden'}); assert.equal(state.role,'superadmin');
  await page.getByRole('link',{name:'Website publik',exact:true}).click(); await page.getByRole('link',{name:'Portal Pengurus'}).first().waitFor(); assert.ok(await page.evaluate(()=>document.styleSheets.length)>0);
  await page.goto(base+'/admin/dashboard'); await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor(); await plain(page,'public to admin');
  await page.goto(base+'/admin/media');
  const png = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32; canvas.getContext('2d').fillRect(0,0,32,32); return canvas.toDataURL('image/png').split(',')[1]; });
  await page.getByLabel('File gambar').setInputFiles({ name:'fixture.png', mimeType:'image/png', buffer:Buffer.from(png,'base64') });
  await page.getByText(/fixture.png.*ready/).waitFor();
  await page.getByLabel('Teks alternatif',{exact:true}).fill('Gambar pengujian upload');
  state.mediaFailure=1; await page.getByRole('button',{name:'Unggah file siap',exact:true}).click(); await page.getByText('Upload sementara gagal.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Coba lagi',exact:true}).click(); await page.getByText(/fixture.png.*success/).waitFor();
  assert.equal(state.calls.filter(c=>c.path==='/api/admin/media' && c.method==='POST').length,2);
  await plain(page,'media upload/retry');
  await page.goto(base+'/admin/pengaturan/seksi-pengurus'); await page.getByRole('button',{name:'Tambah seksi',exact:true}).click(); await page.getByLabel('Nama',{exact:true}).fill('Seksi baru'); await page.getByLabel('Pengurus 1',{exact:true}).fill('Nama pertama'); await page.getByRole('button',{name:'Tambah nama pengurus',exact:true}).click(); await page.getByLabel('Pengurus 2',{exact:true}).fill('Nama kedua'); await page.getByRole('button',{name:'Simpan',exact:true}).click(); await page.getByRole('heading',{name:'Seksi baru',exact:true}).waitFor(); assert.equal(state.sections.at(-1).nama_pengurus,'Nama pertama, Nama kedua');
  await page.goto(base+'/admin/pengaturan/akun-akses'); await page.getByRole('button',{name:'Tambah akun',exact:true}).click(); await page.getByLabel('Nama',{exact:true}).fill('Pengurus baru'); await page.getByLabel('Email',{exact:true}).fill('baru@example.test'); await page.getByLabel('Password awal',{exact:true}).fill('secret123'); await page.getByRole('button',{name:'Simpan',exact:true}).click(); await page.getByRole('heading',{name:'Pengurus baru',exact:true}).waitFor(); assert.equal(state.users.at(-1).role,'pengurus');
  state.authFailure=true; await page.goto(base+'/admin/dashboard'); await page.getByRole('heading',{name:'Sesi belum dapat diverifikasi'}).waitFor(); state.authFailure=false; state.authenticated=false; await page.getByRole('button',{name:'Coba lagi',exact:true}).click(); await page.getByRole('heading',{name:'Masuk admin Masjid Nurul Huda'}).waitFor();
  await context.close();
  await writeFile(evidence+'/report.json',JSON.stringify({report,roles,auth:'401/429/503/recovery/impersonation/retry-revoked',mediaUpload:'process/upload/retry',settings:'category CRUD/account create+status/section names',publicIsolation:'pass'},null,2));
  console.log(JSON.stringify({status:'pass',report,roles}));
} finally { await browser.close(); }
