# AI Agent Playbook — Masjid Nurul Huda

Dokumen ini menjelaskan prosedur kerja rinci untuk AI coding agents. Aturan wajib tetap berada di `.hermes.md` atau `AGENTS.md`; playbook ini digunakan saat membutuhkan langkah operasional yang lebih detail.

## 1. Tujuan

Playbook ini membantu agent:

- memahami task tanpa blind scan;
- menemukan flow aktual secara efisien;
- membuat perubahan aman dan minimal;
- menguji perubahan sesuai risikonya;
- menjaga dokumentasi tetap ringkas dan akurat;
- menghindari technical debt dari eksperimen UI lama.

## 2. Intake Task

Klasifikasikan task ke satu atau beberapa kategori:

- bug fix;
- fitur baru;
- refactor;
- UI/UX redesign;
- auth/RBAC/security;
- database/migration;
- performa;
- media/R2;
- observability/operasional;
- dokumentasi.

Tentukan tingkat risiko:

| Level | Contoh |
|---|---|
| Rendah | copy, style kecil, dokumentasi tanpa perubahan flow |
| Sedang | komponen UI, filter, endpoint read-only, refactor lokal |
| Tinggi | auth, role, mutasi transaksi, media delete, migration |
| Kritis | data production, rollback schema, secret, destructive operation |

Untuk task tinggi/kritis, buat impact map sebelum edit.

## 3. Context Discovery

### Urutan baca

1. Bagian terkait di `SYSTEM_MAP.md`.
2. Route atau view entrypoint.
3. Caller langsung dan dependency yang dipakai.
4. Service/composable terkait.
5. Backend route, service, query, schema.
6. Test yang sudah ada.
7. `RUNBOOK.md` bila menyentuh deployment atau data production.

### Search strategy

Gunakan pencarian simbol/path terarah:

- nama component/composable/service;
- endpoint path;
- nama table/column;
- role/status enum;
- test case terkait.

Jangan membaca semua file besar. Untuk file panjang, fokus pada function, route, atau component section yang berada dalam trace.

### Trace note

Sebelum edit:

```text
Trace: FinanceV2 → useKas → kasService → /api/admin/transaction/... → transaction service → kas_masjid.
Target: src/... dan server/...
Risiko: tinggi, karena memengaruhi transaksi dan RBAC.
```

## 4. Impact Map Template

Periksa setiap area berikut:

```text
API contract:
RBAC/data scope:
State transition:
Database/schema/index:
Cache:
Loading/error/conflict state:
Mobile/accessibility:
Tests:
Documentation:
Deployment/rollback:
```

Tidak semua area harus berubah, tetapi semuanya harus dipertimbangkan.

## 5. Implementation Strategy

### Bug fix

1. Reproduksi atau buktikan symptom dari code/test.
2. Temukan root cause, bukan hanya lokasi error terlihat.
3. Periksa sibling path dengan pola yang sama.
4. Tambahkan regression test.
5. Patch minimal.

### Fitur baru

1. Definisikan user journey dan acceptance criteria.
2. Tentukan contract request/response.
3. Tentukan policy/RBAC.
4. Implementasikan backend source of truth.
5. Implementasikan service/composable/UI.
6. Tambahkan loading, empty, error, conflict, permission state.
7. Tambahkan test dan dokumentasi.

### Refactor

Refactor dibenarkan jika:

- menghilangkan duplikasi nyata;
- memperbaiki testability;
- memperjelas dependency boundary;
- dibutuhkan agar bug/fitur dapat diselesaikan aman;
- tidak mengubah behavior tanpa sengaja.

Jangan menggabungkan refactor besar dengan perubahan behavior besar tanpa alasan dan test yang memadai.

### UI/UX redesign

1. Audit current behavior dan role visibility.
2. Buat information hierarchy sebelum styling.
3. Mulai dari mobile 360 px.
4. Gunakan component/token existing.
5. Pertahankan business flow dan policy backend.
6. Uji keyboard, focus, loading, error, empty, disabled, dan mobile state.
7. Jangan menambah wrapper versi baru hanya untuk visual eksperimen.
8. Status redesign aktif: R1 foundation dan R2 public publication experience `Done`; R3 admin shell dan authentication `In Progress`.
9. Baseline publik R2 dipertahankan. Evaluasi homepage lebih modern hanya kandidat masa depan; R3 berfokus pada shell admin, login, auth loading/recovery, role-aware navigation, dan responsive accessibility tanpa mengubah contract backend auth.
10. Headless UI telah dihapus; gunakan primitive reka canonical dan jangan menambah dependency UI paralel.

## 6. Finance Safety Procedure

Untuk setiap perubahan transaksi/proposal:

1. Identifikasi status awal dan status akhir.
2. Validasi actor/role.
3. Gunakan conditional update terhadap status lama.
4. Periksa affected rows.
5. Tulis audit event.
6. Pastikan request idempotent atau anti-double-submit.
7. Refetch setelah mutasi.
8. Uji summary/list tetap konsisten.
9. Uji akses negatif setiap role.

Skenario minimum:

```text
pengurus membuat proposal
→ ketua menyetujui
→ bendahara menyetujui
→ transaksi masuk laporan approved
```

Tambahkan skenario reject, conflict, duplicate request, invalid foreign key, dan unauthorized actor.

## 7. RBAC Review Matrix

Setiap endpoint admin harus diperiksa untuk:

- authentication middleware;
- allowed roles;
- ownership/data scoping;
- field-level restrictions;
- response filtering;
- negative test.

UI visibility tidak pernah dianggap security boundary.

## 8. Database and Migration Procedure

Sebelum migration:

1. Periksa migration terakhir.
2. Jangan edit migration lama yang mungkin sudah applied.
3. Buat migration baru dan backward-compatible bila memungkinkan.
4. Tentukan backfill dan default.
5. Uji fresh database.
6. Uji upgrade dari versi sebelumnya.
7. Pastikan aplikasi versi lama tidak langsung rusak jika deployment bertahap.
8. Siapkan backup/restore note.

Untuk perubahan destruktif gunakan:

```text
expand → backfill → dual-read/write bila perlu → switch → cleanup pada release lain
```

## 9. Media D1–R2 Procedure

Untuk upload:

- key tidak boleh berasal dari input client tanpa validasi kuat;
- cek collision;
- jangan overwrite object existing;
- cleanup hanya object yang dibuat request tersebut;
- metadata dan object harus memiliki korelasi yang dapat diaudit.

Untuk delete:

- cek media usage;
- archive atau pending-delete terlebih dahulu bila referenced;
- hapus R2 dan D1 dengan recovery path;
- log failure parsial;
- sediakan reconciliation job untuk orphan.

## 10. Error and UX Contract

Gunakan kategori error:

- validation;
- unauthorized;
- forbidden;
- conflict;
- not found;
- rate limited;
- dependency unavailable;
- internal error.

Response ideal:

```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_STATE_CHANGED",
    "message": "Status transaksi telah berubah.",
    "fields": {},
    "request_id": "..."
  }
}
```

Perilaku frontend:

- `401`: sesi invalid, arahkan login bila benar-benar unauthorized;
- `403`: halaman atau state tidak memiliki akses;
- `409`: refetch dan jelaskan stale state;
- validation: error inline pada field;
- network/5xx: pertahankan data lama jika aman dan sediakan retry;
- mutasi: tombol disabled dan tidak dapat dikirim dua kali.

## 11. Validation Matrix

### UI-only

- typecheck;
- build;
- viewport 360, tablet, desktop;
- keyboard navigation;
- focus visibility;
- loading/empty/error/disabled;
- dark mode bila didukung.

### API/service

- happy path;
- invalid input;
- unauthorized;
- forbidden;
- conflict;
- dependency failure;
- response contract.

### Finance

- full approval flow;
- reject;
- duplicate submit;
- concurrent approval;
- data scoping;
- summary consistency;
- audit event.

### Migration

- fresh apply;
- upgrade apply;
- data backfill;
- index/query compatibility;
- rollback/restore note.

### Media

- upload success;
- upload partial failure;
- storage key collision;
- thumbnail consistency;
- referenced delete;
- role restrictions.

## 12. Documentation Update Rules

Update `SYSTEM_MAP.md` ketika:

- route berubah;
- caller/flow utama berubah;
- state machine berubah;
- schema atau relasi penting berubah;
- role policy berubah;
- module ownership berubah.

Update `ROADMAP.md` ketika:

- item prioritas mulai atau selesai;
- dependency berubah;
- acceptance criteria berubah;
- scope milestone berubah.

Jangan menyimpan setiap iterasi padding, radius, atau micro-animation di roadmap. Gunakan commit history atau changelog bila perlu.

## 13. Hermes Agent Usage

### Bootstrap superadmin

- Fresh migration sengaja tidak menghasilkan credential privileged yang usable.
- Bootstrap local memakai `npm run admin:provision:local`; live testing memakai `npm run admin:provision:testing` yang hard-bound ke resource testing.
- Password dibaca dari environment lokal/interaktif, tidak ditulis ke source, chat handoff, screenshot, log, memory, atau skill.
- Command default tidak overwrite akun existing; `--replace-existing` hanya untuk recovery eksplisit.
- Jangan menambah provisioning remote production otomatis. Production memerlukan backup, change window, dan persetujuan eksplisit sesuai RUNBOOK.

### 13.1 Commit dan environment testing

Jika perubahan membentuk slice koheren, seluruh test/build/browser gate relevan lulus, diff bersih dari secret/artifact lokal, dan tidak ada blocker atau bug terbuka, agent langsung:

1. commit dengan pesan yang mencerminkan scope;
2. push branch kerja;
3. push commit yang sama ke branch `testing`;
4. tunggu workflow testing selesai;
5. smoke-check URL testing dan kontrak data/resource isolation yang relevan.

Tidak perlu meminta konfirmasi ulang untuk promosi testing. Jangan menerapkan aturan ini ke `main` atau resource production; merge, migration, deploy, secret, dan operasi destruktif production tetap membutuhkan permintaan eksplisit.

### Memory

Simpan hanya preferensi atau keputusan stabil yang memang perlu lintas sesi. Jangan menyimpan:

- secret;
- credential;
- token;
- cookie;
- data pribadi;
- detail production sensitif;
- progress sementara;
- hipotesis yang belum diverifikasi.

### Skills

Skill proyek harus:

- reusable;
- berisi prosedur, bukan credential;
- memiliki prerequisites;
- memiliki verification step;
- tidak menduplikasi aturan `.hermes.md`.

Kandidat skill yang berguna:

- D1 migration safety;
- finance approval regression test;
- Cloudflare Pages smoke check;
- media D1–R2 reconciliation;
- responsive accessibility audit.

### Subagents

Cocok untuk:

- audit security independen;
- review test coverage;
- audit accessibility;
- review migration;
- inventory legacy code.

Agent utama harus menggabungkan hasil, menyelesaikan konflik, menjalankan validasi, dan menulis laporan akhir. Jangan beri dua subagent ownership file yang sama.

## 14. Final Report Template

```text
Ringkasan:
- hasil utama

Trace:
- caller → service → route → service/repository → storage

File berubah:
- file: alasan

Perubahan behavior:
- sebelum → sesudah

Validasi:
- command: hasil

Dampak keamanan/data:
- ...

Dokumentasi:
- ...

Risiko residual / belum tervalidasi:
- ...
```
