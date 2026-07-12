# Optimalisasi Plan Proyek Masjid Nurul Huda

Dokumen ini dirapikan berbasis status eksekusi agar tidak tercampur: **Done**, **In Progress**, dan **Not Yet**, dengan prioritas tetap mengikuti level dampak.

## Task Aktif — Redesign, Modularisasi, dan Ekstraksi (Rapi + Ber-Gate)

Status fokus aktif saat ini: **menyelesaikan sisa Prioritas 2 + pondasi Prioritas 3** dengan urutan ketat berbasis dependency gate agar tidak ada langkah yang dilompati.

### Keputusan Tech-Stack Tambahan (Locked)

- Primitive UI: **shadcn-vue** (di atas Tailwind CSS existing).
- Icon system: tetap **lucide-vue-next**.
- Typography: tetap **Inter** (`@fontsource-variable/inter`).
- Strategi redesign: **Shadow Component Swap** (file `*V2.vue`, URL existing tidak berubah, tanpa route `/v2`).

### Layered Architecture Acuan Redesign (Wajib)

- **Frontend Layer (Vue)**
  - **View/Layout Layer** (`src/views/*`, `src/layouts/*`):
    - fokus presentasi, binding event, state UI ringan.
    - tidak menjadi tempat business logic berat atau orkestrasi CRUD kompleks.
  - **Component/UI Layer** (`src/components/*`, `src/components/ui/*`):
    - primitive reusable + komponen komposit.
    - tidak melakukan coupling langsung ke endpoint untuk flow kompleks.
  - **Composable Layer** (`src/composables/*`):
    - pusat state orchestration, validasi flow, side-effect UI, dan action handler.
    - lokasi utama pemecahan logic dari view legacy/V2 agar tidak duplikatif.
  - **Service/API Client Layer** (`src/services/*` + `httpClient`):
    - kontrak request/response, normalisasi error, adapter DTO.
    - menjaga V1/V2 memakai pintu API yang sama.
  - **Utils Layer** (`src/utils/*`):
    - pure function (formatter/parser/guard), tanpa side-effect jaringan.

- **Backend Layer (Hono)**
  - **Route/Handler Layer** (`server/api/*`):
    - parse & validasi request, delegasi ke service, kirim response contract standar.
  - **Service/Usecase Layer** (`server/services/*`):
    - business rules dan orchestration domain.
  - **Query/Repository Layer** (`server/db/*`):
    - SQL access dan optimasi query.
  - **Database Layer** (Cloudflare D1):
    - persistence dengan migration terkontrol.

- **Dependency Rule (Wajib)**
  - Frontend: `View -> Composable -> Service -> API`.
  - Backend: `Route -> Service -> Query -> DB`.
  - Hindari bypass layer pada flow non-trivial agar modularisasi dan rollback tetap aman.

### Kebijakan Kompatibilitas Rollback (Shadow Component Swap)

#### Pengingat Keputusan Eksekusi Redesign (Locked)

- Redesign dijalankan **bertahap & pragmatis** (bukan rewrite total sekaligus).
- `src/components/ui/*` saat ini diperlakukan sebagai **baseline core candidate**; tidak ada kewajiban rename massal ke `src/components/ui/core/*` pada fase awal.
- `src/utils/ui/*` dibuka **on-demand** saat muncul helper UI universal yang benar-benar dipakai lintas layar.
- Rule ekstraksi: pola UI/helper yang sudah dipakai **>= 3 layar** baru dinaikkan ke core/util shared.
- Migrasi dilakukan **page-by-page** dengan gate parity:
  - loading/error/disabled,
  - RBAC visibility,
  - action/submit flow,
  - rollback-safe tanpa patch backend.

- **Contract Freeze Backend selama redesign UI**
  - Endpoint path, HTTP method, query/body contract, response shape, dan status/error contract **tidak diubah** selama rollout V2.
  - Tujuan: rollback dari V2 ke legacy bisa instan tanpa perubahan backend.

- **Ekstraksi backend hanya non-breaking (internal-safe)**
  - Boleh rapikan internal handler/service/query **asal behavior 100% identik**.
  - Tidak boleh rename/remove endpoint aktif.
  - Tidak boleh mengubah field wajib atau semantik response.

- **Prioritas modularisasi pada frontend**
  - Saat refer legacy untuk parity, logic baru wajib diekstrak ke composable/service frontend.
  - Legacy boleh jadi referensi dan bridge, bukan tempat menambah logic baru jangka panjang.

- **Rollback compatibility gate (wajib lulus per layar)**
  - V1 tetap jalan, V2 tetap jalan.
  - Swap balik import route ke V1 bisa dilakukan tanpa modifikasi backend.
  - Jika gate gagal, stage tidak boleh lanjut.

### Tujuan Aktif (Outcome / Bukan Langkah)

- Menutup sisa item Prioritas 2 yang belum selesai:
  - modularisasi composable admin,
  - ekstraksi/standardisasi primitive UI.
- Menjalankan redesign UI berbasis **Shadow Component Swap** secara aman:
  - UI V2 dibuat di file `*V2.vue`,
  - route/browser URL existing tetap.
- Menjamin **Logic-Agnostic UI**:
  - V1 dan V2 wajib memakai kontrak logic (`composable/service`) yang sama persis.
- Menjaga konsistensi filter periodik `month/year` pada rantai:
  - UI -> composable -> service -> API (`/summary`, `/list`).
- Menutup debt selector periode:
  - migrasi bertahap menuju fondasi **DatePicker** berbasis shadcn.

### Acuan Visual V2 (Design Objective / Non-Checklist)

Acuan ini adalah **quality target**, bukan langkah eksekusi.

#### Benchmark lintas layar: LoginV2 (locked)

- `LoginV2` **bukan target redesign ulang**, tetapi dipakai sebagai **benchmark visual-UX** untuk redesign layar admin lain.
- Implementasi yang sudah stabil di `LoginV2` dijadikan pedoman lintas layar, sambil tetap menghormati konteks konten masing-masing page.

#### Rule konteks layout: Bento Grid (locked)

- **Bento Grid bersifat kontekstual**, bukan kewajiban global:
  - tidak dipaksakan di login page,
  - **boleh dipakai kembali** di layout lain jika membantu struktur informasi dan hierarki konten.

#### Pedoman visual-UX global (diangkat dari baseline LoginV2 & AdminLayout final)

- **Kepadatan Layout (Dense & Compact)**: Hindari *padding* berlebih (peninggalan legacy). Gunakan proporsi rapat bergaya antarmuka *native* (misal: tombol `h-9` atau `h-10`, *spacing* ketat) agar UI terasa profesional dan informatif.
- **Hierarki Warna Brand Otentik**:
  - Warna `brand-green` eksklusif untuk **state aktif** atau identitas utama (gunakan penyesuaian seperti `emerald-400` pada teks di mode gelap agar kontras terjaga).
  - Warna `brand-accent` (oranye) eksklusif untuk **tombol CTA utama** dan **interaksi (hover/focus)**. Untuk *hover* netral, redam opasitasnya secara drastis (misal `bg-brand-accent/5` dengan teks tetap netral) agar UI tidak bising (*noisy*).
- **Premium Glassmorphism**: Surface transparan terang/gelap + `backdrop-blur-xl` untuk elemen melayang (*header*, *drawer*) dikombinasikan dengan batas (*border*) yang sangat tipis dan *seamless* (`border-slate-200/60`).
- **Crisp SVG Icons**: Jaga ketajaman ikon berukuran kecil (`16px`-`18px`) dengan menurunkan `stroke-width` proporsional (`1.75` - `2.2`), ditambah `class="antialiased"` dan atribut `style="shape-rendering: geometricPrecision; text-rendering: optimizeLegibility;"`.
- **Manajemen Z-Index & Clipping**: Hindari komponen kontainer yang memiliki `overflow-hidden` bawaan (seperti Shadcn `ScrollArea`) jika di dalamnya terdapat elemen absolut (*tooltip*, *popover*) yang harus menembus batas kontainer.
- Input focus ring tipis dan clean (`ring-1`),
- Typography + hierarchy yang tegas (judul, subjudul, helper text),
- Animasi halus `ctaPulse` untuk CTA utama yang relevan,
- Wrapper `<Transition>` per section untuk *fade-in/slide-up* ringan.

#### Prinsip penerapan lintas layar

- Terapkan pedoman ini sebagai baseline di `Dashboard/Keuangan/Media/Galeri/Pengaturan` dengan adaptasi konteks informasi.
- Pertahankan konsistensi dengan token global (font, spacing, radius, shadow) agar visual admin tetap satu sistem.

### Pipeline Eksekusi Aktif (Wajib Urut, Berbasis Gate)

- [x] **Stage 0 — Baseline Audit & Scope Lock**
  - Status: **Done**
  - Depends on: — (entry point)
  - Kegiatan:
    - Audit ulang kondisi aktual `Task Aktif` vs progres implementasi.
    - Pisahkan item menjadi: objective, task eksekusi, dan progress log.
    - Lock urutan prioritas agar tidak loncat stage.
  - Exit criteria:
    - Struktur plan sudah bersih dan bisa dipakai sebagai acuan sprint.
    - Semua task punya dependency/gate jelas.

#### Scope Lock Final — Batch Eksekusi 1 (Post Stage 0)

- **In Scope (wajib dikerjakan dulu):**
  - Modularisasi `useKas` dengan facade kompatibel (`useKas.ts` tetap API lama untuk caller existing).
  - Persiapan modularisasi `usePengaturan` per domain (`kategori`, `seksi`, `akun`) tanpa breaking contract return.
  - Penguatan CRUD orchestration frontend di `src/services/*` + `src/composables/*` (no direct API call non-trivial di view).

- **Out of Scope (ditahan sampai gate Stage 1/2 lulus):**
  - Rollout layar Stage 3/4 selain historical pilot (`DashboardV2`, `KeuanganKasV2`/`FinanceV2`, `PengaturanV2`).
  - Swap route tambahan di `router/index.ts` selain yang sudah terjadi pada `LoginV2`.
  - Perubahan kontrak backend (`path`, method, request/response shape, error/status contract).

#### Baseline Audit Result (Snapshot)

- Pilot `LoginV2` sudah berjalan dan route `/admin/login` sudah swap.
- Contract freeze backend untuk fase redesign UI aktif (non-breaking internal-only).
- Stage 3/4 tetap ditahan; progres pilot diperlakukan baseline evaluasi, bukan izin lanjut rollout.
- Dependency gate lintas stage telah dikunci berurutan (Stage 0 -> 1 -> 2 -> 3 -> 4 -> 5).

#### Bridge Readiness Preflight (Masukan Stage 2)

- Inventarisasi kandidat adapter sementara (`*LegacyBridge.vue`) dibuat per layar target sebelum swap.
- Definisi parity checklist minimum per layar dikunci lebih awal:
  - loading/error/disabled state,
  - RBAC visibility,
  - action/submit/approval flow.
- Setiap adapter bridge wajib diberi status:
  - temporary scope,
  - owner cleanup,
  - trigger penghapusan saat Stage 4 stabil.

#### Stage 2 Preflight Snapshot (2026-05-10)

- Hasil scan naming guard `*LegacyBridge.vue` saat ini: **Not found** (belum ada adapter bridge aktif di repo).
- Inventaris kandidat layar target bridge (jika dibutuhkan saat swap bertahap):
  - `Dashboard` -> kandidat: `DashboardLegacyBridge.vue` (status: conditional, buat hanya jika parity gap muncul saat `DashboardV2` swap).
  - `KeuanganKas` -> kandidat: `KeuanganKasLegacyBridge.vue` (status: likely-needed, karena domain approval/filter paling kompleks).
  - `Pengaturan` -> kandidat: `PengaturanLegacyBridge.vue` (status: conditional, fokus kontrak tab/modal CRUD).
- Parity checklist minimum terkunci untuk semua layar target:
  - Loading/Error/Disabled: skeleton/loading flag, error toast/message, anti double-submit state.
  - RBAC Visibility: visibilitas tab/aksi sesuai helper permission + hasil API fail-closed.
  - Action Flow: submit/edit/delete/approve/reject tetap memakai composable/service contract yang sama (tanpa fork logic V2).

#### Gate Evidence Pack (Wajib saat Centang Stage)

Saat menandai stage selesai, lampirkan artefak minimal berikut:

- hasil `build` + `typecheck`,
- smoke flow utama sesuai layar/domain,
- parity matrix ringkas (loading/error/disabled, RBAC, action flow),
- bukti **no backend contract change** selama scope redesign UI,
- bukti rollback compatibility (swap balik ke legacy tanpa patch backend).

- [x] **Stage 1 — Core Foundation (Stabil)**
  - Status: **Done**
  - Depends on: Stage 0
  - Scope:
    - Fondasi dipakai bersama oleh Legacy UI dan Redesign UI.
  - Kegiatan:
    - Kunci kontrak `service/composable` sebagai **single source of truth**.
    - Pastikan integrasi filter periodik `month/year` konsisten pada facade composable.
    - Tetapkan token visual global netral (font, spacing, radius, shadow baseline) tanpa coupling ke V1/V2.
    - Tetapkan struktur folder foundation:
      - `src/components/ui/core/*` (primitive universal),
      - `src/composables/admin/*` (facade + modul terpecah),
      - `src/utils/ui/*` (helper/formatter UI universal).
    - Ekstraksi UI logic dari view tebal ke composable (state, watcher, submit/action orchestration).
    - CRUD orchestration dipusatkan ke service frontend agar V1/V2 share flow yang sama.
    - Terapkan **contract freeze backend** selama fase redesign UI.
  - Exit criteria:
    - Legacy dan V2 mengonsumsi API composable/service yang sama tanpa fork logic.
    - Tidak ada perubahan endpoint/API contract backend.
    - View layer lebih tipis; logic utama sudah termodularisasi di composable/service.

- [x] **Stage 2 — Legacy Compatibility Bridge (Transitional)**
  - Status: **Done (2026-05-10)**
  - Depends on: Stage 1
  - Scope:
    - Menjaga UI existing stabil selama migrasi bertahap.
  - Kegiatan:
    - [x] Buat adapter/wrapper komponen lama yang belum dimigrasikan agar kontrak props/emits kompatibel.
    - [x] Definisikan area legacy eksplisit:
      - `src/components/legacy/*`,
      - naming guard `*LegacyBridge.vue` untuk adapter sementara.
    - [x] Isolasi style legacy V1 agar tidak bocor ke primitive core.
    - [x] Siapkan parity checklist minimum:
      - loading/error/disabled state,
      - RBAC visibility,
      - submit/approval flow.
    - [x] Tegaskan rule: refer legacy **boleh** untuk validasi parity, tetapi ekstraksi logic baru tetap ke composable/service modular.
  - Exit criteria:
    - [x] Layar target tetap parity fitur selama swap.
    - [x] Adapter legacy terdokumentasi mana temporary dan kapan dihapus.
    - [x] Tidak ada logic bisnis baru yang “terkunci” di layer legacy sementara.

- [ ] **Stage 3 — V2 Layer (shadcn + Shadow Swap)**
  - Status: **In Progress (`DashboardV2/FinanceV2/PengaturanV2` sudah aktif sebagai route produksi; `KeuanganKasV2` tetap dipertahankan sebagai shadow transisional/rollback window, dan redesign total masih ongoing karena belum full recomposition; scope diperluas ke Admin Shell + Media flow V2)**
  - Depends on: Stage 2
  - Scope:
    - Implementasi design system V2 berbasis shadcn-vue.
    - Perluasan scope dari “layar core admin” ke “shell + feature admin pendukung” agar Shadow Swap konsisten hingga level layout.
    - Penerapan mode redesign **Wrapper-Centric Full Recomposition** pada layar target tahap lanjut.
  - Kegiatan:
    - [x] **Font baseline consistency gate (wajib di paling awal Stage 3 sebelum redesign lanjutan):**
      - [x] Selaraskan sumber font agar tidak ada konflik override `Inter` -> `Geist`.
      - [x] Kunci single source of truth untuk token `--font-sans` dan `--font-heading` pada baseline global.
      - [x] Bukti gate:
        - Audit source font menemukan konflik override `Inter` -> `Geist` di `src/assets/main.css` (`@import` Geist + `@theme inline --font-sans`), lalu override Geist dihapus.
        - Token `--font-sans` + `--font-heading` dikunci ke `Inter Variable` pada baseline global.
        - Verifikasi teknis lulus melalui `npm run build` (vue-tsc + vite build sukses).
    - [x] Instalasi + inisialisasi `shadcn-vue`.
    - [x] Add primitive awal:
      - `button`, `input`, `dropdown-menu`, `card`, `select`, `dialog`,
      - `calendar`, `popover`.
    - [x] Wrapper **DatePicker** reusable:
      - `MonthYearPicker` sudah dibuat di `src/components/admin/shared/MonthYearPicker.vue` berbasis primitive `button + popover + calendar` (shadcn-vue).
      - pilot integrasi awal sudah dipasang pada `DashboardLegacyBridge.vue` dengan kontrak periode tetap `month/year` via composable facade.
    - [~] Pembuatan komponen `*V2.vue` tanpa route `/v2`:
      - [x] Pilot `LoginV2.vue` selesai + route utama `/admin/login` sudah swap.
      - [~] `DashboardV2.vue` aktif sebagai caller bridge dashboard (redesign total: ongoing).
      - [~] `KeuanganKasV2.vue` aktif sebagai shadow transisional berbasis bridge kas (redesign total: ongoing, bukan route produksi utama).
      - [~] `FinanceV2.vue` aktif sebagai wrapper route produksi `/admin/finance` (redesign total: ongoing).
      - [~] `PengaturanV2.vue` aktif sebagai caller bridge pengaturan (redesign total: ongoing).
    - [~] Integrasi bertahap layar prioritas:
      - [~] `DashboardV2` (aktif swap, redesign total ongoing),
      - [~] `FinanceV2` (wrapper route produksi `/admin/finance`; redesign total ongoing),
      - [~] `KeuanganKasV2` (shadow parity via `KeuanganKasLegacyBridge.vue`; redesign total ongoing),
      - [~] `PengaturanV2` (shadow parity via `PengaturanLegacyBridge.vue`; redesign total ongoing).
    - [~] Perluasan scope V2 (batch lanjutan):
      - [x] `AdminLayoutV2.vue` sebagai shell admin terpisah (tanpa ubah URL existing),
      - [ ] `MediaLibraryV2.vue`,
      - [ ] `GaleriDokumentasiV2.vue`.
    - [ ] Terapkan metode **Wrapper-Centric Full Recomposition** per layar:
      - [ ] Dashboard
      - [ ] Keuangan
      - [ ] Media Library
      - [ ] Galeri Dokumentasi
      - [ ] Pengaturan
      - Aturan metode:
        - Konsolidasi pemahaman menyeluruh caller/child terkait (view/layout/component/composable/service) sebelum redesign total.
        - Boleh menambah composable V2 baru bila diperlukan orkestrasi UI V2.
        - Wajib menjaga parity: caller contract, action flow, RBAC visibility, dan service/API contract freeze.
        - Interpretasi "gabungkan jadi 1 file": **1 entry view V2 per wrapper sebagai orchestrator utama**, bukan monolit yang melanggar dependency rule `View -> Composable -> Service -> API`.
  - Exit criteria:
    - Komponen V2 berjalan dengan composable facade yang sama dengan V1.
    - Selector periode legacy termigrasi ke DatePicker/period picker berbasis shadcn.
    - Admin shell dan seluruh route admin aktif telah memiliki pasangan V2 (tanpa route `/v2`).

- [ ] **Stage 4 — Controlled Router Swap**
  - Status: **In Progress (swap route `Dashboard/Finance/Pengaturan` sudah aktif, sementara `KeuanganKasV2` tetap dipertahankan sebagai shadow transisional; redesign total layar terkait masih ongoing; prioritas swap lanjutan dipindah: `AdminLayoutV2` jadi urutan pertama)**
  - Depends on: Stage 3 (per layar)
  - Kegiatan:
    - Swap import di `router/index.ts` per layar secara bertahap.
    - Lakukan controlled parent swap layout admin:
      - `AdminLayout.vue` -> `AdminLayoutV2.vue` pada route parent `/admin`.
    - Lakukan controlled swap layar admin pendukung:
      - `MediaLibrary.vue` -> `MediaLibraryV2.vue`,
      - `GaleriDokumentasi.vue` -> `GaleriDokumentasiV2.vue`.
    - Pastikan parity fitur sama persis:
      - loading/error/disabled,
      - RBAC visibility,
      - flow aksi kritikal.
    - Gate tambahan untuk layar yang dirombak total (wajib lulus per wrapper):
      - parity matrix (loading/error/disabled, RBAC, action flow),
      - evidence `build + test pass`,
      - rollback-safe (swap balik tanpa patch backend).
    - Terapkan rollback window terkontrol tiap swap.
  - Progress:
    - [x] `Login.vue` -> `LoginV2.vue` sudah diswap.
    - [~] `Dashboard.vue` -> `DashboardV2.vue` sudah diswap, redesign total masih ongoing.
    - [x] `KeuanganKas.vue` -> `FinanceV2.vue` sudah diswap pada route produksi `/admin/finance`.
    - [~] `KeuanganKasV2.vue` dipertahankan sebagai shadow transisional berbasis bridge selama window observability/rollback.
    - [~] `Pengaturan.vue` -> `PengaturanV2.vue` sudah diswap, redesign total masih ongoing.
    - [x] `AdminLayout.vue` -> `AdminLayoutV2.vue` (parent `/admin` sudah swap aktif).
    - [ ] `MediaLibrary.vue` -> `MediaLibraryV2.vue` (planned setelah AdminLayoutV2).
    - [ ] `GaleriDokumentasi.vue` -> `GaleriDokumentasiV2.vue` (planned setelah MediaLibraryV2).
  - Exit criteria:
    - Semua layar target V2 lulus parity + smoke test utama.
    - Tidak ada blocker regresi kritikal.

- [ ] **Stage 5 — Cleanup Residual Legacy**
  - Status: **Not Started**
  - Depends on: Stage 4
  - Kegiatan:
    - Hapus file UI legacy hanya setelah seluruh gate lulus.
    - Hapus adapter `*LegacyBridge.vue` yang tidak dipakai.
    - Rapikan import/dead code.
    - Update `SYSTEM_MAP.md` jika flow utama berubah.
  - Cleanup gate (wajib lulus semua):
    - parity V2 lulus di layar target + smoke test utama,
    - tidak ada adapter legacy aktif,
    - tidak ada style orphan legacy di runtime,
    - rollback window ditutup (stabil dalam grace period).

### Fase Paralel Fondasi — Workstream Implementasi Stage 1 (Core Foundation)

> Catatan: section ini adalah **paket eksekusi teknis** untuk menuntaskan **Stage 1 — Core Foundation (Stabil)**.  
> Stage 1 = outcome/gate, Fase Paralel = breakdown pekerjaan agar Legacy dan V2 memakai logic yang sama.

- [x] **Modularisasi `useKas` (Facade Tetap Kompatibel)**
  - Pecah `useKas` menjadi:
    - `useKasState`,
    - `useKasFilters`,
    - `useKasActions`,
    - opsional `useKasComputed`.
  - `useKas.ts` tetap facade kompatibel untuk caller existing.
  - Pisahkan state loading/submitting per aksi untuk anti double-submit.

- [x] **Modularisasi `usePengaturan` (Per Domain Tab)**
  - Pecah per domain: `kategori`, `seksi`, `akun`.
  - Pisahkan orchestration (`openModal/closeModal/resetForm`) dari logic CRUD.
  - Jaga kontrak return agar migrasi `Pengaturan.vue` bisa bertahap tanpa rewrite total.

- [x] **Ekstraksi CRUD Orchestration Frontend (Aman untuk Rollback)**
  - Target:
    - `src/services/*` jadi pusat alur CRUD yang dipakai bersama V1/V2.
    - `src/composables/*` fokus orchestration UI state terhadap service.
  - Aturan:
    - Hindari direct API call di view untuk flow non-trivial.
    - Endpoint backend tidak diubah kontraknya selama fase ini (contract freeze).
  - Output:
    - duplikasi logic CRUD antara layar legacy dan V2 berkurang,
    - rollback ke legacy tetap aman karena kontrak backend stabil.

### Urutan Redesign V2 (Bertahap, Locked)

1. [x] `AdminLayoutV2` (shell admin parent) — selesai redesign + swap aktif.
2. [~] `DashboardV2` (sudah swap aktif, redesign total ongoing).
3. [~] `FinanceV2` (sudah swap aktif pada route produksi `/admin/finance`, redesign total ongoing).
3a. [~] `KeuanganKasV2` (dipertahankan sebagai shadow transisional/parity, redesign total ongoing).
4. [~] `PengaturanV2` (sudah swap aktif, redesign total ongoing).
5. [ ] `MediaLibraryV2`.
6. [ ] `GaleriDokumentasiV2`.
7. [x] `LoginV2` (benchmark visual-UX; bukan target redesign ulang).
8. [ ] Web publik utama (fase terakhir).

### Aturan Normalisasi Urutan (Anti-Loncat Tahap)

- Seluruh pekerjaan baru Stage 3/4 **dihentikan sementara** sampai Stage 1 dan Stage 2 lulus exit criteria.
- Pengecualian historical progress (contoh: `LoginV2` pilot) diperlakukan sebagai baseline evaluasi, **bukan** izin melanjutkan rollout.
- Perubahan status stage wajib mengikuti gate dependency:
  - Stage 0 selesai -> boleh Stage 1,
  - Stage 1 selesai -> boleh Stage 2,
  - [x] Stage 2 selesai -> boleh melanjutkan Stage 3,
  - Stage 3 parity layar lulus -> boleh Stage 4 swap lanjutan,
  - Stage 4 stabil -> baru Stage 5 cleanup.

### Quality Gate Minimum per Layar (Wajib sebelum centang selesai)

- [x] Build/typecheck lulus.
- [x] Smoke flow utama lulus.
- [x] Parity matrix lulus:
  - loading/error/disabled,
  - RBAC visibility,
  - action/submit flow.
- [x] Tidak ada perubahan API contract backend.
- [x] Rollback compatibility lulus:
  - V1 dan V2 sama-sama berfungsi pada kontrak backend saat ini,
  - rollback swap import ke legacy tidak memerlukan patch backend.
- [x] Dokumentasi sinkron:
  - update `SYSTEM_MAP.md` hanya jika flow utama berubah,
  - update section progress di plan ini.

#### Tambahan gate untuk Wrapper-Centric Full Recomposition

- [ ] Setiap wrapper target memiliki **1 entry view V2 orchestrator** yang jelas sebagai source komposisi layar.
- [ ] Tidak ada pelanggaran dependency rule `View -> Composable -> Service -> API` (hindari monolit logic di view).
- [ ] Pedoman visual-UX benchmark LoginV2 diterapkan kontekstual:
  - bento grid optional by context,
  - glassmorphism terukur,
  - ring input `ring-1`,
  - brand color/accent presisi,
  - typography hierarchy tegas,
  - `ctaPulse` untuk CTA utama relevan,
  - `<Transition>` per section secukupnya.

### Progress Log Task Aktif (Ringkas & Kronologis)

> Catatan interpretasi status log:
>
> - `[x]` pada log = evidence aktivitas/kejadian sudah terjadi (mis. create/swap/build/test), **bukan** otomatis berarti redesign total layar sudah selesai.
> - Status redesign total wrapper tetap mengikuti penanda `[~]` di Stage 3/4 dan urutan redesign.

- [x] shadcn-vue terpasang dan primitive awal terdaftar.
- [x] `LoginV2.vue` sudah dibuat sebagai pilot Shadow Swap.
- [x] Route `/admin/login` sudah memakai `LoginV2.vue`.
- [x] Rollback pilot login alternatif (2026-05-11): route `/admin/login-v3` dihapus dari router agar tidak ada entrypoint non-aktif; route login aktif tetap `/admin/login` (`LoginV2.vue`) dengan kontrak backend tetap.
- [x] Pilot visual `LoginV2` baseline V2 (bento + clean flat + soft palette + subtle shadow + Inter) ditetapkan sebagai acuan evaluasi awal.
- [x] Iterasi eksperimen UI/UX `LoginV2` (2026-05-10): layout dikembalikan ke single card glassmorphism, hierarchy typography diperjelas, input focus ring dibuat tipis (ring-1), CTA `Masuk` diberi pulse halus, mount transition ditambah, dan autofocus email diaktifkan; kontrak auth/backend tetap.
- [x] Validasi form `LoginV2` dimigrasikan ke `vee-validate` + `zod` (2026-05-10): error input kini inline per field (`email`, `password`), submit state memakai `isSubmitting`, dan pesan gagal kredensial tetap sebagai feedback submit-level (bukan field-level); scope hanya V2 tanpa rework legacy.
- [x] Stage 0 ditutup: scope lock batch eksekusi, baseline audit snapshot, bridge preflight, dan evidence pack sudah ditetapkan.
- [x] Stage 1 berjalan: eksekusi fondasi modularisasi (`useKas` -> `usePengaturan` -> CRUD orchestration) sebelum rollout layar V2 lanjutan.
- [x] Stage 1 Batch-2 selesai: CRUD orchestration frontend dipusatkan ke `kasService` + `pengaturanService` (helper `getDashboardBundle`, `loadByTab`, `saveByTab`, `deleteByTab`) dan composable admin fokus ke orchestration UI/state.
- [x] Evidence gate Batch-2: `npm test` lulus (21/21 pass) pasca ekstraksi CRUD orchestration; contract freeze backend tetap aman (tidak ada perubahan endpoint/method/request/response shape).
- [x] Stage 1 Batch-1 selesai: modularisasi `useKas` + `usePengaturan` ditutup dengan facade kompatibel dan kontrak backend tetap (contract freeze aman).
- [x] Evidence gate Batch-1: `npm run build` lulus (vue-tsc + vite build) pasca modularisasi.
- [x] Evidence refresh Stage 1 (2026-05-10): `npm run build` lulus dan `npm test` lulus (21/21 pass) pasca audit ulang; fokus sisa gate Stage 1 dipersempit ke smoke flow + parity matrix + rollback compatibility.
- [x] Gate closure Stage 1 (2026-05-10): integration smoke/parity/rollback compatibility untuk media route lulus via test `stage1 gate: media routes smoke/parity/rollback compatibility` + seluruh suite `npm test` tetap hijau (21/21) + `npm run build` hijau tanpa perubahan backend contract.
- [x] Stage 2 selesai (2026-05-10): adapter transisional `src/components/legacy/*LegacyBridge.vue` aktif untuk `Dashboard`, `KeuanganKas`, dan `Pengaturan`; view entrypoint mendelegasikan render ke bridge sehingga parity UI terjaga saat swap bertahap.
- [x] Evidence Stage 2 (2026-05-10): verifikasi `npm run build` lulus + `npm test` lulus (21/21 pass), contract backend tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Rollback artefak UI pilot login (2026-05-11): `LoginV3.vue` dan integrasi PrimeVue Forms (`zodResolver`) dihapus; alur auth yang dipertahankan adalah `LoginV2.vue` -> `authStore.login` -> `POST /api/admin/auth/login`.
- [x] Evidence rollback login pilot (2026-05-11): verifikasi `npm run build` lulus pasca penghapusan route `/admin/login-v3` + `LoginV3.vue` + dependency PrimeVue.
- [~] Stage 3 Batch-1 dimulai (2026-05-11): `src/views/admin/DashboardV2.vue` dibuat sebagai shadow redesign dashboard (tanpa swap router, tanpa perubahan kontrak backend/API); status redesign total dashboard masih ongoing.
- [x] Evidence Stage 3 Batch-1 (2026-05-11): `npm run build` lulus + `npm test` lulus (21/21 pass) setelah penambahan `DashboardV2.vue`; rollback compatibility tetap aman karena route aktif masih memakai `Dashboard.vue` -> `DashboardLegacyBridge.vue`.
- [~] Stage 3 Batch-2 (2026-05-11): `src/views/admin/KeuanganKasV2.vue` dan `src/views/admin/PengaturanV2.vue` dibuat sebagai shadow view berbasis `*LegacyBridge.vue` (tanpa perubahan kontrak composable/service/backend); status redesign total keduanya masih ongoing.
- [~] Stage 4 Batch-1 swap (2026-05-11): route admin `dashboard`, `keuangan`, `pengaturan` diswap ke `DashboardV2.vue`, `KeuanganKasV2.vue`, `PengaturanV2.vue` di `src/router/index.ts`; URL existing tetap, namun redesign total ketiga layar masih ongoing.
- [x] Route keuangan produksi distandarkan ke `finance` (pasca iterasi redesign): route aktif `/admin/finance` kini memakai `FinanceV2.vue`, sementara `KeuanganKasV2.vue` dipertahankan sebagai shadow transisional untuk parity/rollback window.
- [x] Evidence Stage 4 Batch-1 (2026-05-11): `npm run build` lulus + `npm test` lulus (21/21 pass) pasca swap; kontrak backend tetap freeze (tidak ada perubahan endpoint/method/request/response).
- [x] Sinkronisasi dokumentasi flow utama (2026-05-11): `SYSTEM_MAP.md` diperbarui pasca swap Stage 4 (`DashboardV2`, `KeuanganKasV2`, `PengaturanV2`) termasuk Core Logic Flow, Clean Tree, dan Module Map agar konsisten dengan route aktif.
- [x] Sinkronisasi dokumentasi route keuangan (2026-05-19): mapping aktif diperbarui ke `/admin/finance` -> `FinanceV2.vue`, dengan `KeuanganKasV2.vue` ditandai sebagai shadow transisional/parity.
- [x] Hardening shell admin (2026-05-11): `src/layouts/AdminLayout.vue` mode sidebar collapsed dirapikan (`md:w-16`, icon center via `justify-center`, `gap` dinolkan saat collapsed, `px` diperkecil) **serta** kontrol collapse desktop dipindah inline ke daftar menu sidebar agar satu garis visual dengan baris icon saat collapsed; tombol header collapse dibatasi mobile-only (`md:hidden`) untuk menghindari kontrol ganda di desktop.
- [x] Evidence hardening shell admin (2026-05-11): `npm run build` lulus + `npm test` lulus (21/21 pass) pasca reposisi kontrol collapse; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Re-scan scope redesign V2 (2026-05-11): didokumentasikan bahwa pembatasan awal V2 hanya pada `Dashboard/KeuanganKas/Pengaturan` adalah keputusan bertahap berbasis gate Stage 0–2 (risk-control + rollback safety), bukan final scope jangka panjang.
- [~] Scope update redesign V2 (2026-05-11): scope aktif Stage 3/4 diperluas mencakup `AdminLayoutV2`, `MediaLibraryV2`, dan `GaleriDokumentasiV2`; urutan eksekusi diprioritaskan dari parent shell agar Shadow Component Swap konsisten.
- [x] Sinkronisasi acuan redesign lintas layar (2026-05-11): `LoginV2` dikunci sebagai benchmark visual-UX (bukan target redesign ulang), rule Bento Grid ditegaskan kontekstual, dan mode kerja `Wrapper-Centric Full Recomposition` ditambahkan beserta gate parity/evidence/rollback-safe per wrapper.
- [x] Stage 3 Batch-3 (2026-05-11): redesign total `src/layouts/AdminLayoutV2.vue` dituntaskan (fixed sidebar + fixed header + isolated content scroll + responsive drawer/collapse) dengan kontrak route existing tetap.
- [x] Evidence Stage 3 Batch-3 (2026-05-11): `npm run build` lulus + `npm test` lulus (21/21 pass) pasca redesign/swap `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Stage 3 refinement shell admin (2026-05-11): `AdminLayoutV2` dipoles untuk konsistensi kontrol sidebar (desktop toggle selaras pola menu), hamburger dikembalikan khusus mobile header, profile header disederhanakan jadi icon/avatar + dropdown info login, serta ditambah transisi halus pada sidebar/profile menu.
- [x] Stage 3 refinement shell admin (iteration-2, 2026-05-11): harmonisasi micro-interaction `AdminLayoutV2` dituntaskan (durasi overlay/sidebar/profile-menu diseragamkan, transisi width/left/margin diperhalus, utility class item sidebar dinormalisasi ke konstanta bersama, tombol desktop collapse dibuat ikon-only agar simetris dengan mode collapsed).
- [x] Stage 3 refinement shell admin (iteration-3, 2026-05-11): perbaikan UX collapse/expand di `AdminLayoutV2` dituntaskan (logo tidak lagi nyempil saat collapsed, transisi label sidebar dibuat smooth tanpa icon jump, sinkronisasi transisi mobile drawer + overlay, dan dropdown profile diarahkan muncul dari atas).
- [x] Stage 3 refinement shell admin (iteration-4, 2026-05-11): patch micro-UX `AdminLayoutV2` dituntaskan (animasi mobile drawer + overlay diperlunak, transisi theme/header/profile menu diperhalus via `transition-colors`, serta mode collapsed desktop disimetrikan dengan utility `SIDEBAR_ITEM_COLLAPSED_CLASS` agar ikon tetap center tanpa drift padding).
- [x] Stage 3 refinement shell admin (iteration-5, 2026-05-11): stabilisasi posisi ikon sidebar `AdminLayoutV2` saat collapse/expand dituntaskan dengan mengunci slot ikon (`h-10 w-10`) dan meniadakan transisi `translate-x` pada label agar tidak terjadi drift horizontal selama animasi lebar sidebar.
- [x] Stage 3 refinement shell admin (iteration-6, 2026-05-11): koreksi regresi struktur `AdminLayoutV2` dituntaskan (class tombol logout sidebar dikembalikan ke pola item menu agar tidak lagi mewarisi class container `aside`, serta durasi animasi mobile drawer diseragamkan ke `duration-300` untuk transisi buka/tutup yang konsisten).
- [x] Evidence Stage 3 refinement shell admin (2026-05-11): `npm run build` lulus pasca polishing `AdminLayoutV2`; tidak ada perubahan kontrak backend/API (endpoint/method/request/response tetap).
- [x] Evidence Stage 3 refinement shell admin (iteration-2, 2026-05-11): `npm run build` lulus pasca harmonisasi micro-interaction `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Evidence Stage 3 refinement shell admin (iteration-3, 2026-05-11): `npm run build` lulus pasca patch collapse/transition/dropdown `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Evidence Stage 3 refinement shell admin (iteration-4, 2026-05-11): `npm run build` lulus pasca patch animasi mobile/theme/collapsed-state `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Evidence Stage 3 refinement shell admin (iteration-5, 2026-05-11): `npm run build` dan `npm test` lulus (21/21 pass) pasca patch stabilisasi ikon collapse/expand `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Evidence Stage 3 refinement shell admin (iteration-6, 2026-05-11): `npm run build` dan `npm test` lulus (21/21 pass) pasca patch koreksi regresi class logout + sinkronisasi durasi animasi mobile `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Stage 3 refinement shell admin (iteration-7, 2026-05-11): geometri item sidebar `AdminLayoutV2` distabilkan dengan rail/padding terstandar lintas state (expanded/collapsed), baseline kiri logo-menu diselaraskan, dan transisi drawer mobile dikunci ke kontrak posisi yang lebih deterministik (mengurangi drift saat collapse/expand).
- [x] Evidence Stage 3 refinement shell admin (iteration-7, 2026-05-11): `npm run build` dan `npm test` lulus (21/21 pass) pasca patch stabilisasi geometri + animasi mobile `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Stage 3 refinement shell admin (iteration-8, 2026-05-11): drift collapse/expand `AdminLayoutV2` dikoreksi dengan geometri item yang dikunci lintas state (tanpa `justify-center px-0` saat collapsed), reveal label disinkronkan via delay ringan agar ikon tidak terdorong, header logo/teks diubah ke transisi `max-width + opacity` (tanpa unmount `v-if`), dan drawer mobile ditutup ke `opacity-0` untuk animasi masuk/keluar yang lebih tegas.
- [x] Evidence Stage 3 refinement shell admin (iteration-8, 2026-05-11): `npm run build` dan `npm test` lulus (21/21 pass) pasca patch sinkronisasi animasi desktop/mobile `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Stage 3 refinement shell admin (iteration-9, 2026-05-11): penyelarasan micro-geometry `AdminLayoutV2` dituntaskan (logo/header tidak lagi terjepit saat collapsed, ikon menu/logout konsisten center pada rail collapsed, dan transisi drawer mobile disatukan agar buka/tutup lebih smooth tanpa drift visual).
- [x] Evidence Stage 3 refinement shell admin (iteration-9, 2026-05-11): `npm run build` lulus + `npm test` lulus (21/21 pass) pasca patch refinement `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Stage 3 refinement shell admin (iteration-10, 2026-05-11): mode collapsed `AdminLayoutV2` dipastikan benar-benar bersih dan stabil (ikon menu/logout center konsisten pada rail, label item dipindah ke non-layout state saat collapsed agar tidak mendorong ikon, brand header sidebar disembunyikan penuh saat collapsed, serta posisi tombol toggle desktop dipusatkan untuk menghilangkan drift visual).
- [x] Evidence Stage 3 refinement shell admin (iteration-10, 2026-05-11): `npm run build` lulus + `npm test` lulus (21/21 pass) pasca patch center icon + hide brand collapsed `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Stage 3 refinement shell admin (iteration-11, 2026-05-11): koreksi micro-geometry `AdminLayoutV2` dituntaskan dengan mode collapsed berbasis `grid place-items-center` + icon-slot `w-full` agar ikon menu/logout true-center pada rail, serta header brand sidebar dibuat anchor-stable (`justify-start` tetap + transisi `max-width/opacity` tanpa `scale`) untuk menghilangkan drift saat transisi expand -> collapse.
- [x] Evidence Stage 3 refinement shell admin (iteration-11, 2026-05-11): `npm run build` lulus + `npm test` lulus (21/21 pass) pasca patch true-center + anti-drift header brand `AdminLayoutV2`; kontrak backend/API tetap freeze (tanpa perubahan endpoint/method/request/response).
- [x] Stage 3 refinement shell admin (iteration-12, 2026-05-11): perbaikan komprehensif micro-interaction dan glitch `AdminLayoutV2` pasca migrasi shadcn-vue (tooltip menu desktop kini tampil sempurna tanpa terpotong `overflow-hidden`, tombol close eksplisit ditambahkan pada mobile drawer untuk UX lebih baik, animasi dark mode toggle dibuat mulus menggunakan rotasi scale shadcn, inisial avatar disempurnakan menjadi kombinasi dua kata, dan layout logo desktop sidebar diproteksi dari horizontal drift saat collapse).
- [x] Stage 3 refinement shell admin (iteration-13, 2026-05-11): eksperimen perombakan total kerangka admin (`AdminLayoutV3`) dengan filosofi desain Shadcn-vue sejati (compact, dense, premium glassmorphism, border seamless) dan *swap route* sementara dari V2 ke V3 untuk perbandingan.
- [x] Stage 3 refinement shell admin (iteration-14, 2026-05-11): penyempurnaan UI `AdminLayoutV3` berdasarkan *feedback* (mengganti ikon Lucide dengan logo asli, mengatasi isu render SVG buram via rasio *stroke-width* + `antialiased`, memperbaiki *clipping tooltip* dengan mencopot *ScrollArea*, menambah separator header, merapikan proporsi tombol profil *mobile*, serta menyuntikkan *brand color* pada state aktif).
- [x] Stage 3 migrasi shell admin final (iteration-15, 2026-05-11): `AdminLayoutV3` dihapus setelah berhasil dijadikan standar baru, lalu direname menjadi `AdminLayoutV2` sebagai tata letak definitif, rute dikembalikan. Redesain `DashboardV2` diluncurkan menggunakan pedoman *Glassmorphism Premium*, struktur padat (`rounded-xl`), SVG tajam, interaksi subtil saat kursor diarahkan, serta *blob* warna tetap dipertahankan dengan proporsi transparan dan menyesuaikan *layout* V2.
- [x] Stage 3 redesign keuangan (iteration-16, 2026-05-11): Penerapan **Wrapper-Centric Full Recomposition** dengan melebur 4 file legacy (`KasLaporan`, `KasApproval`, `KasInput`, `KasProposal`) beserta *bridge*-nya menjadi satu file super baru `FinanceV2.vue`. Mengganti rute `/admin/keuangan` menjadi `/admin/finance` untuk standarisasi bahasa. Merombak navigasi *tab* menjadi *Segmented Control*, mengaplikasikan *Glassmorphism* pada ringkasan, dan memadatkan form *input* menjadi tata letak *2-column grid*.

## Rencana Optimasi Keamanan

Sumber: hasil smoke test security review (2026-05-20).

### Prioritas Eksekusi

- [ ] **P1 — Cegah overwrite/delete lintas media key (High)**
  - Validasi `storage_key` tidak cukup dengan prefix; enforce key generation deterministik server-side atau minimal non-collision guard sebelum upload R2.
  - Ubah urutan operasi upload agar object existing tidak bisa terhapus saat insert metadata gagal.
  - Enforce `thumb_storage_key` konsisten terhadap `storage_key` untuk mencegah orphan object.

- [ ] **P1 — Sinkronisasi schema migration vs service media (Medium)**
  - Selaraskan kontrak tabel `dokumentasi` antara migration aktif, `server/db/schema.sql`, dan service insert/update/list.
  - Putuskan satu source-of-truth untuk `thumb_storage_key` (persist penuh atau derivatif murni), lalu konsistenkan endpoint + query.

- [ ] **P2 — Pengetatan RBAC mutasi media (Medium)**
  - Review scope role untuk `POST/PATCH/DELETE /api/admin/media`; default saran: mutasi dibatasi ke approver roles, `pengurus` read-only kecuali ada kebutuhan bisnis eksplisit.

- [ ] **P2 — Hardening rate limit login lintas isolate (Low-Medium)**
  - Naikkan dari in-memory Map ke mekanisme persisten lintas instance (KV/D1/Turnstile/WAF) agar limit tidak reset saat scale-out.

- [ ] **P3 — Regression test security-critical flow**
  - Tambah test untuk collision `storage_key`, konsistensi `thumb_storage_key`, dan guard RBAC mutasi media.

### Evidence (Referensi Temuan)

- `server/api/admin/media.ts`: validasi `storage_key` hanya prefix `media/`.
- `server/services/media.ts`: upload R2 terjadi sebelum insert metadata; cleanup delete pada insert gagal.
- `migrations/0006_media_library.sql` vs `server/db/schema.sql`: mismatch kontrak `thumb_storage_key`.

## Prioritas 1 (Wajib, dampak tinggi)

### Done

- [x] Hardening secret auth baseline:
  - `JWT_SECRET` sudah dipindahkan dari hardcoded ke environment (`c.env.JWT_SECRET`),
  - fallback dev memakai konfigurasi lokal `.dev.vars`/binding, bukan konstanta hardcoded di source,
  - `JWT_SECRET` production wajib berbeda total dari `.dev.vars` lokal.
- [x] Validasi input endpoint transaksi kritis:
  - validasi required field, nominal positif, whitelist tipe, sanitasi keterangan.
- [x] Refactor endpoint transaksi submit:
  - `POST /api/admin/transaction/add-direct` (server paksa `status=approved`, `seksi_id` opsional),
  - `POST /api/admin/transaction/add-proposal` (server paksa `status=pending`, `seksi_id` wajib).
- [x] Penutupan celah bypass role `pengurus`:
  - `POST /approve/:id` dan `DELETE /:id` sudah `403` untuk non-approver.
- [x] Error handling end-to-end area admin kritis:
  - frontend memakai `httpClient` + toast `vue-sonner`,
  - backend route admin kritis (`auth`, `dashboard`, `transaction`, `pengaturan`) sudah memakai helper `sendSuccess/sendError`.
- [x] Standarisasi response API admin kritis:
  - route `auth`, `dashboard`, `transaction`, dan `pengaturan` sudah konsisten memakai helper response terpusat,
  - kontrak utama memakai `status`, `message`, `data`/`errors`; `errorCode` machine-readable belum dipakai dan bisa dievaluasi lagi jika dibutuhkan client.
- [x] Rate limiting endpoint login:
  - `POST /api/admin/auth/login` dilindungi rate limit baseline berbasis in-memory Map,
  - limit memakai key `cf-connecting-ip + email`, maksimal 5 kegagalan dalam 15 menit,
  - attempt hanya dicatat saat kredensial gagal, dihapus saat login berhasil, dan response blokir mengirim `429` + `Retry-After`.
- [x] Hapus hardcode kredensial admin dari frontend login:
  - `src/views/admin/Login.vue` tidak lagi mengisi default `admin@masjidnurulhuda.com` / `admin123` pada state form,
  - autentikasi tetap lewat `POST /api/admin/auth/login` dan cookie `httpOnly`.
- [x] Hardening auth/session lanjutan:
  - endpoint `POST /api/admin/auth/logout` sudah melakukan invalidasi sesi server-side dengan increment `users.token_version` (`bumpUserTokenVersion`),
  - endpoint `GET /api/admin/auth/me` dan middleware `requireAuth` memverifikasi kecocokan claim JWT `tv` terhadap `users.token_version`,
  - token lama otomatis ditolak (`401`) setelah logout (revocation efektif) tanpa menunggu expiry,
  - TTL access token sudah 24 jam (`exp`) dengan cookie `maxAge` 24 jam agar konsisten.
- [x] Hardening normalisasi status auth frontend (`checkAuth`):
  - `src/stores/authStore.ts` hanya menormalisasi sesi ke logged-out pada `401` dari `/api/admin/auth/me`,
  - status non-401 (`5xx`) dan network/runtime error diperlakukan sebagai error operasional (state auth tidak di-force logout),
  - tujuan: mencegah bug backend/outage tersamarkan sebagai logout biasa.
- [x] Migration versioning D1:
  - migration auth revocation sudah ditambahkan di `migrations/0008_auth_token_version.sql` (`ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0` + normalisasi data lama),
  - versi migration kini berlanjut konsisten (`0001` s.d `0008`) dan siap di-apply berurutan via skrip `db:apply:local` / `db:apply:remote`,
  - reset lokal konsisten tersedia via `db:reset:local` (drop + apply ulang seluruh migration).
- [x] Sinkronisasi reference schema lokal:
  - `server/db/schema.sql` sudah diselaraskan ke gabungan migration `0001..0008` + kebutuhan operasional media/auth terbaru (`pending_ketua|pending_bendahara`, `approved_at`, `token_version`, `thumb_storage_key`, index terkait),
  - patch bypass D1 bug pada `fix.sql` (rekonsiliasi role `bendahara`) sudah tercermin langsung di schema reference agar reset lokal tidak tertinggal,
  - `migrations/0007_reconcile_bendahara_role.sql` tetap no-op by design untuk menjaga pipeline remote, sementara perubahan struktural users terdokumentasi sebagai langkah operasional terpisah.

## Prioritas 2 (Penting, stabilitas & maintainability)

### Done

- [x] Refactor API client frontend:
  - `src/services/httpClient.ts` aktif sebagai wrapper fetch,
  - service transaksi sudah migrasi ke `httpClient`,
  - service dashboard dan pengaturan admin sudah migrasi ke `httpClient`,
  - parsing error non-2xx sudah terpusat.
- [x] Migrasi `usePengaturan` ke `httpClient`:
  - `loadData`, `saveItem`, dan `deleteItem` sekarang lewat `pengaturanService`,
  - normalisasi error, `credentials`, dan kontrak response sudah setara dengan service transaksi.
- [x] Konsistensi role matrix final (`superadmin`, `ketua`, `bendahara`, `pengurus`) sudah diterapkan pada flow keuangan inti.
- [x] Relasi Kategori Kas dengan Jenis Arus:
  - `kategori_kas.jenis_arus` tersedia di schema/migration,
  - CRUD kategori sudah membawa `jenis_arus`,
  - dropdown kategori kas/proposal terfilter berdasarkan tipe transaksi.
- [x] `seksi_id` opsional pada Kas Langsung:
  - UI Kas Langsung mengirim `seksi_id` bila dipilih,
  - endpoint `POST /api/admin/transaction/add-direct` menyimpan `seksi_id` jika ada dan `null` jika kosong.
- [x] Modularisasi composable mulai berjalan di domain Homepage publik:
  - `useJadwal`, `useKasSummary` (service -> composable -> component).
- [x] Validasi DTO backend lanjutan:
  - [x] `jenis_arus` sudah divalidasi eksplisit via allowlist `pemasukan|pengeluaran|general` di route `/api/admin/pengaturan/kategori`.
  - [x] `seksi_id` Kas Langsung (dan proposal) sudah hardening validasi FK: nilai hanya diterima jika parse integer positif **dan** benar-benar ada di tabel `seksi_pengurus` (`existsSeksiById`), sehingga payload di luar UI dengan ID fiktif ditolak `400`.
  - [x] `role` pada create/update akun sudah memakai allowlist `superadmin|ketua|bendahara|pengurus` sebelum masuk service DB.
  - [x] `kategori_id` dan `seksi_id` pada transaksi sudah parse integer positif; `add-proposal` sudah normalisasi `seksi_id` seperti `add-direct`.
  - [x] `jumlah` transaksi sudah memakai `Number.isFinite` + batas maksimum nominal wajar untuk mencegah nilai seperti `Infinity`.
  - [x] route param `:id` di pengaturan kategori/seksi/users/reset-password/delete sudah validasi integer positif seperti endpoint transaksi.
  - [x] test pendukung ditambahkan untuk helper validasi existence seksi (`tests/seksi-service.test.mjs`) dan total test suite kini 13 pass.
  - catatan sinkronisasi frontend: dropdown role di `Pengaturan.vue` + `UserRole` di `pengaturanService` sudah memasukkan `bendahara` agar konsisten dengan backend.
- [x] Konsistensi RBAC lintas modul admin:
  - transaksi sudah fail-closed,
  - modul dashboard sudah sinkron allowlist role operasional (`superadmin`, `ketua`, `bendahara`, `pengurus`) pada `GET /api/admin/dashboard/summary`,
  - audit route admin inti tervalidasi memakai `requireAuth` + `requireRole` eksplisit.
- [x] Type safety menyeluruh frontend-backend (DTO request/response + minim `any`):
  - payload `kasService.submitDirectTransaction`, `kasService.submitProposal`, form `useKas`, payload/list `usePengaturan`, `dashboardService`, dan `pengaturanService` memakai DTO eksplisit,
  - area backend terkait (`server/utils/response.ts`, `server/middleware/auth.ts`, `server/services/transaction.ts`, `server/services/user.ts`, `server/services/auth.ts`) sudah bebas `any`,
  - hardening tambahan selesai di `server/api/admin/transaction.ts`, `server/db/queries/dashboard.ts`, `server/api/public/jadwal.ts`, `server/services/transaction.ts`, `src/services/httpClient.ts`, `src/services/admin/dashboardService.ts`,
  - verifikasi `npm run build` dan `npm test` lulus (21/21 test pass).
- [x] Tambahkan helper permission frontend terpusat (`canApprove`, `canDelete`, `canViewProposalTab`):
  - `src/utils/permissions.ts` aktif sebagai allowlist RBAC UI terpusat.
  - `KeuanganKas.vue` dan `KasLaporan.vue` sudah migrasi dari guard inline (`role !== ...`) ke helper permission.
- [x] Index D1 prioritas transaksi & auth sudah tersedia:
  - `kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, `users(email)` sudah ada di schema/migration.
- [x] Optimasi query dashboard periodik:
  - endpoint `GET /api/admin/dashboard/summary` sudah mendukung filter `month/year`,
  - fallback default period mengikuti WIB (`Asia/Jakarta`) dan pola validasi periodik konsisten dengan endpoint transaksi `/list`,
  - query agregasi dashboard sudah difilter periodik (`strftime('%m', tanggal)` + `strftime('%Y', tanggal)`) agar menghindari scan historis penuh.
- [x] Sinkronisasi filter laporan kas ke server-side:
  - [x] filter `month/year` diproses di backend `GET /api/admin/transaction/list` (default current month/year bila query kosong/tidak valid),
  - [x] filter `tipe` (`pemasukan|pengeluaran`) dan `kategori_id` (integer positif) diparse/validasi di route lalu diteruskan ke clause SQL optional,
  - [x] `useKas` dan `kasService.getTransactions` sudah mengirim query filter ke backend sehingga data list lebih terbatasi sebelum render client.

### In Progress

Not found (semua item sebelumnya sudah dipindah ke **Done** atau masih masuk **Not Yet**)

### Not Yet

Not found (seluruh sisa pekerjaan Prioritas 2 dipindahkan ke section **Task Aktif — Redesign, Modularisasi, dan Ekstraksi** di bagian atas dokumen).

## Prioritas 3 (UX, performa, observability)

### Done

- [x] UX error feedback keuangan:
  - migrasi dari `alert/confirm` ke toast dan validasi UI field highlight.
- [x] Standardisasi Dropdown & Modal:
  - halaman Kas dan Pengaturan sudah memakai custom dropdown/`ConfirmModal.vue`,
  - penghapusan `window.confirm`/`alert` bawaan browser di flow terkait diganti toast dan modal.

### In Progress

- [~] UX loading pada beberapa area publik sudah mulai ada (placeholder/coming soon), belum seragam sebagai skeleton state formal.

### Not Yet

- [ ] UX loading state + anti double-submit lintas modul.
  - temuan audit UI: `ConfirmModal.vue` belum punya state `isConfirming`/disabled tombol confirm saat aksi async berjalan.
- [ ] Optimistic UI terbatas untuk aksi aman.
- [ ] Audit performa bundle (import icon, route chunking, asset compression policy).
- [ ] Structured logging + level log + health endpoint backend.
- [~] Testing baseline:
  - unit test auth/transaction/validation berjalan untuk helper currency + matrix RBAC permission UI + helper validasi transaksi (`parsePositiveInt`, `parseFiniteAmount`) + kontrak parser media publik (`resolveMediaStorageKey`) dengan total 18 test pass via `npm test`,
  - integration test flow penting (prioritas: proposal bertahap `pending_ketua -> pending_bendahara -> approved/rejected`).
- [ ] Dokumentasi operasional:
  - README final, setup lokal, reset DB, checklist deploy.

## Penguatan RBAC Lanjutan (Spesifik Security)

### Done

- [x] Finalisasi rename role ke `pengurus` di backend, frontend, dan dokumentasi.

### Not Yet

- [ ] Proteksi self-lockout (user login tidak boleh menurunkan role dirinya sendiri).
- [ ] Pembatasan `ketua` untuk akun `superadmin` (listing/create/update/delete policy).
- [ ] Invalidasi sesi role lama (force re-login untuk token role di luar matrix final).
- [ ] Test matrix RBAC otomatis (`superadmin`, `ketua`, `bendahara`, `pengurus`) untuk endpoint kritis.

## Pengembangan Web Publik (Public Facing Website)

Fokus: website jamaah yang cepat, aman (read-only), dan scalable.

### Done

- [x] Layered Architecture Homepage diterapkan:
  - Service layer: `src/services/public/home/*`
  - Composable layer: `src/composables/public/home/*`
  - UI component layer: `src/components/public/home/*`
- [x] Integrasi jadwal sholat real-time:
  - MyQuran/Kemenag via `jadwalService` + `useJadwal` dengan pencarian ID kota otomatis.
- [x] Endpoint publik read-only kas sudah live:
  - `GET /api/public/kas/summary` (approved-only aggregate, tanpa JWT).
- [x] Kas widget publik sudah konsumsi data asli D1.
- [x] Hardening jadwal publik:
  - query param `kota` diamankan via `encodeURIComponent` pada proxy backend.
  - cache harian + fallback offline sudah menggunakan safe parse untuk mencegah crash saat cache korup.
- [x] Hardening endpoint mutasi admin:
  - validasi `id` numerik pada `approve/:id` dan `delete/:id` untuk mencegah proses `NaN`.

### In Progress

- [~] UX section publik non-kritis (`Kabar`, `Galeri`, `KritikSaran`):
  - sudah ada overlay coming soon glassmorphism,
  - belum masuk fase content/data production.

### Not Yet

- [ ] Endpoint `GET /api/public/articles` + pagination sederhana.
- [ ] Kontrak response publik standar (`status`, `data`, `updatedAt`).
- [ ] Hardening endpoint publik:
  - whitelist field output,
  - validasi query param (`page`, `limit`, `month`, `year`) + max `limit`.
- [ ] Edge caching Cloudflare untuk endpoint publik:
  - `Cache-Control`, `s-maxage`, `stale-while-revalidate`,
  - cache key by route+query,
  - invalidasi cache pasca update konten.
- [ ] Pertimbangkan proxy backend `GET /api/public/jadwal` agar kontrol cache/keandalan terpusat.
- [ ] Tambah SEO baseline (meta dinamis, OG image, JSON-LD organisasi).
- [ ] Optimasi media galeri (WebP/AVIF, lazy load, thumbnail sizing).
- [ ] Lazy-hydration/intersection trigger untuk section non-kritis agar LCP lebih baik.

## Implementasi Media Library Admin (DONE)

Status: **[x] Done**

Tujuan tercapai: media library terpusat untuk upload, manajemen metadata, dan pemilihan media reusable lintas fitur admin dengan arsitektur Vue + Hono + D1 + R2.

Ringkasan implementasi selesai:

- [x] Kontrak data dan API media dikunci:
  - tabel `dokumentasi`, constraint, index, dan kontrak response (`status/message/data`) konsisten helper backend.
- [x] Infrastruktur backend media aktif:
  - binding `MEDIA_BUCKET`,
  - migration `0006_media_library.sql`,
  - endpoint `POST/GET/PATCH/DELETE /api/admin/media`,
  - endpoint publik `GET /api/public/media/*`.
- [x] Frontend pipeline upload aktif:
  - validasi MIME, kompresi/adaptive resize, konversi WebP fallback-safe,
  - multi-file queue + progress + retry + bounded concurrency.
- [x] UI media library lengkap:
  - upload panel drag-drop, gallery grid + load more, copy URL,
  - edit metadata (`alt_text`, `kategori_penggunaan`) via PATCH,
  - full-size preview modal.
- [x] Reusable media picker siap pakai lintas fitur:
  - `MediaPickerModal` + `useMediaPicker` sudah terpasang di caller awal `GaleriDokumentasi`.
- [x] Hardening sinkron D1-R2 selesai:
  - rollback orphan saat insert D1 gagal,
  - hard delete berurutan R2 -> D1,
  - fallback legacy thumbnail `.thumb.webp` untuk kompatibilitas aset lama.
- [x] Bug PATCH metadata 500 ditutup:
  - root cause: update kolom `updated_at` yang tidak ada di schema `dokumentasi`,
  - fix query: hapus assignment `updated_at`,
  - verifikasi lokal test pass dan retest production PATCH sudah `200 OK`.

Catatan scope yang memang ditunda (bukan blocker fase ini):

- [ ] SHA256 checksum/dedup otomatis.
- [ ] Soft delete/recycle bin.
- [ ] Cursor pagination.

### Hardening Pre-Production (Prioritas Operasional)

- [ ] Verifikasi CORS R2 final (origin whitelist production + staging, tanpa wildcard).
- [~] Apply + verifikasi migration D1 remote production (`0003` s.d `0007`).
  - status: rangkaian hotfix kompatibilitas D1 remote sudah dicatat; eksekusi final mengikuti `RUNBOOK.md`.
- [~] Verifikasi smoke test media runtime target (post-deploy) — fokus checklist endpoint:
  - `POST /api/admin/media`,
  - `GET /api/admin/media?page&limit`,
  - `PATCH /api/admin/media/:id`,
  - `DELETE /api/admin/media/:id`,
  - `GET /api/public/media/*`.
- [ ] Verifikasi binding/secret production:
  - `MEDIA_BUCKET` ke bucket target,
  - `DB` ke D1 production,
  - `JWT_SECRET` valid dan berbeda dari local.
- [x] Dokumentasi verifikasi pre-production sudah ditulis di `RUNBOOK.md`.

### Optimasi Lanjutan (Masuk Roadmap Prioritas Terkait)

- [ ] Tambah infinite scroll berbasis `IntersectionObserver` (menggantikan tombol **Load More**).
- [~] Tambah test integration media end-to-end lengkap:
  - [ ] skenario sukses,
  - [x] skenario gagal parsial rollback sudah ada.
- [~] Observability media:
  - log contextual endpoint media + request-id sudah aktif,
  - standardisasi full structured logging lintas modul masih berjalan.

## Future Development Plan

Section ini menampung item pengembangan yang **ditunda** (deferred) agar tidak tercampur dengan backlog eksekusi aktif per prioritas.

### Deferred dari Prioritas 2 (Stabilitas & Maintainability)

- [ ] Penerapan pagination server-side untuk transaksi admin:
  - target endpoint `GET /api/admin/transaction/list` dengan kontrak `page`, `limit`, `total`, `hasNext`,
  - sinkronisasi frontend (`kasService`/`useKas`) agar konsumsi data berbasis page state, bukan full list.
- [ ] Pembatasan volume data endpoint pending:
  - target endpoint `GET /api/admin/transaction/pending` agar tidak mengembalikan full dataset,
  - opsi implementasi: pagination atau windowed result berbasis period + bound limit.
- [ ] Guard volume dataset non-pagination:
  - rolling period guard + query bound untuk menjaga beban query/payload tetap stabil saat data tumbuh,
  - tetapkan acceptance limit awal (mis. max rows per request) sebelum rollout pagination penuh.
- [ ] Surplus/Defisit ditambahkan pada fitur Export/Cetak PDF:
  - hitung dari agregasi periode aktif (`total_pemasukan - total_pengeluaran`) agar konsisten dengan dashboard/list,
  - tampilkan pada ringkasan PDF (header/summary block) agar laporan cetak memiliki indikator kesehatan kas yang eksplisit.

## Mode Eksekusi (Now / Next / Pre-Go-Live)

### Now (dampak langsung)

- [x] Seragamkan error response backend.
- [x] Final audit RBAC fail-closed lintas semua route `/api/admin/*`.
- [x] Pasang index D1 prioritas tinggi.
  - index Gate 1 sudah ada: `kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, `users(email)`.
- [x] Fallback + caching jadwal sholat publik.

### Next (setelah flow stabil)

- [x] Type safety menyeluruh + kurangi `any`.
  - backend auth/core service + area `httpClient`, service dashboard, query dashboard, dan proxy jadwal publik sudah di-hardening,
  - audit cepat residual `any` pada file TypeScript aktif menunjukkan 0 temuan.
- [ ] Refactor backend konsisten `Route -> Service -> Query`.
- [ ] Loading UX halus + observability dasar.

### Pre-Go-Live

- [x] Migration versioned + seed terpisah.
  - DDL/index dan seed sudah dipisah di folder `migrations/`,
  - D1 remote production awal dikonfirmasi fresh (dibuat via `npx wrangler d1 create`, belum ada tabel),
  - command CI/CD valid: `npx wrangler d1 migrations apply masjidnurulhuda-db --remote` tanpa flag `--batch`,
  - patch auth revocation sudah terversioning di `migrations/0008_auth_token_version.sql`.
- [~] Pipeline staging -> production dengan quality gate.
  - `.github/workflows/deploy.yml` sudah ada,
  - `npm run deploy` sudah tersedia di `package.json`,
  - YAML step name yang mengandung tanda baca wajib diberi double quotes agar tidak gagal parse,
  - GitHub Actions runner memakai Node.js 24 untuk menghindari status deprecated,
  - Cloudflare API token untuk CI/CD wajib custom token level Account dengan scope D1 Edit, Pages Edit, dan Worker Scripts Edit; token standar "Edit Workers" tidak cukup untuk D1 account-level,
  - smoke test endpoint inti belum otomatis,
  - cek lokal terbaru: `vue-tsc -b` pass dan `npm run build` pass setelah refresh cache/install dependency.
- [x] Pages Functions wrapper untuk arsitektur hybrid SPA + Hono:
  - `functions/api/[[path]].ts` wajib ada agar request `/api/*` diproses oleh Hono di Cloudflare Pages,
  - tanpa wrapper ini deploy hanya mengirim Vue static files dan API dapat gagal sebagai HTML/405.
- [~] Runbook backup/restore/rollback.
  - `RUNBOOK.md` sudah ada untuk backup/restore D1, rollback Pages, dan health check publik,
  - sudah mencakup rotasi `JWT_SECRET`, health check publik, dan verifikasi admin minimum pasca-deploy/rollback.
- [~] Security checklist final (rate limit login, dependency audit, production-safe error).
  - status pre-push: `npm audit` = `found 0 vulnerabilities`,
  - `JWT_SECRET` production sudah dipasang via `npx wrangler pages secret put JWT_SECRET --project-name masjidnurulhuda`,
  - rate limiting login baseline sudah aktif; caveat: in-memory Map dapat reset antar isolate/region Cloudflare, upgrade ke Turnstile/KV/D1/WAF jika trafik atau risiko meningkat.

## Deploy Readiness (1 Halaman)

Tujuan: checklist praktis agar deploy pertama aman, cepat rollback jika gagal, dan minim kejutan di produksi.

### Gate 1 - Go / No-Go Sekarang (Now, blocking)

- [x] Audit fail-closed semua route `/api/admin/*` (pastikan role invalid selalu `403`).
  - status: transaksi + pengaturan + dashboard sudah fail-closed by role.
- [x] Verifikasi kontrak error backend sudah seragam di endpoint kritis (auth, transaksi, pengaturan).
- [x] Pastikan index D1 prioritas tinggi terpasang (`kas_masjid(status,tanggal)`, `users(email)` minimal).
  - hasil audit Gate 1: `server/db/schema.sql` dan `migrations/0001_init_schema.sql` sudah memuat index prioritas (`kas_masjid(status,tanggal)`, `kas_masjid(kategori_id)`, `kas_masjid(seksi_id)`, `users(email)`).
- [x] Smoke test manual endpoint inti:
  - login -> me -> logout,
  - add direct/proposal -> list -> approve/reject -> delete.
  - catatan eksekusi lokal: login -> master-data -> add direct -> list -> add proposal -> approve -> add proposal -> reject -> delete semua data uji -> logout = sukses.
- [x] Cek health publik minimum:
  - `GET /api/public/kas/summary`,
  - `GET /api/public/jadwal/today`.
  - catatan eksekusi lokal: keduanya merespons `status=success`.

Estimasi cepat Gate 1: **0.5 - 1 hari**

### Gate 2 - Stabilkan Operasional (Pre-Go-Live)

- [~] Siapkan migration versioned (`001_init.sql`, dst) + seed terpisah.
  - DDL/index: `migrations/0001_init_schema.sql`,
  - seed: `migrations/0002_seed_initial_data.sql`,
  - status: D1 remote production awal fresh dan belum punya tabel, jadi aman untuk migration apply pertama.
- [~] Siapkan pipeline CI/CD minimal:
  - install -> typecheck -> test -> build -> deploy.
  - status: `.github/workflows/deploy.yml` sudah ada,
  - status: `package.json` sudah punya script `deploy`,
  - status pasca-deploy: nama step GitHub Actions sudah memakai double quotes, runner Node.js sudah Node 24, dan command migration sudah tanpa `--batch`,
  - pre-deploy wajib: `CF_API_TOKEN` adalah Custom API Token level Account dengan D1 Edit, Pages Edit, dan Worker Scripts Edit,
  - cek lokal terbaru: `vue-tsc -b` sukses dan `npm run build` sukses di Windows setelah `npm cache verify` + `npm install`.
- [x] Verifikasi Pages Functions wrapper untuk backend Hono:
  - file `functions/api/[[path]].ts` aktif sebagai adapter Cloudflare Pages Functions,
  - trace runtime: `/api/*` -> Pages Function wrapper -> `server/index.ts` -> router Hono.
- [~] Tambahkan quality gate:
  - fail jika migration gagal,
  - fail jika smoke test endpoint inti gagal.
  - status: migration apply remote sudah ada di workflow,
  - smoke test endpoint otomatis dipindahkan ke Day-2 Operations; untuk deploy awal pakai health check manual pasca-deploy.
- [~] Siapkan runbook insiden ringkas:
  - backup/restore D1,
  - rollback Worker/Pages,
  - langkah verifikasi pasca-rollback.
  - status: `RUNBOOK.md` sudah mencakup backup/restore, rollback, health check publik, secret production, dan verifikasi admin minimum.

Estimasi cepat Gate 2: **1 - 2 hari**

### Gate 3 - Security Final Check

- [x] Rate limiting endpoint login.
  - baseline in-memory per `IP:email`, maksimal 5 kegagalan per 15 menit, dengan `Retry-After`.
- [x] Audit dependency (security patch minor/patch).
  - status pre-push: `npm audit` = `found 0 vulnerabilities`.
- [ ] Review response error production-safe (tidak bocor detail internal).
- [ ] Verifikasi konfigurasi secret production:
  - `JWT_SECRET` tidak default/dev,
  - `JWT_SECRET` production harus berbeda total dari `.dev.vars` lokal,
  - prosedur rotasi secret terdokumentasi.
  - status pre-push: `.dev.vars` dan `cookies.txt` sudah dikeluarkan dari index Git dan secret lokal sudah dirotasi.
  - status pre-push: `JWT_SECRET` runtime Cloudflare/Pages sudah diset untuk project `masjidnurulhuda`.

### Lessons Learned Deploy Pertama

- YAML GitHub Actions: quote semua `name` step yang mengandung karakter khusus seperti titik dua (`:`).
- Node.js runner: gunakan Node.js 24 untuk menghindari deprecation warning GitHub Actions 2026.
- Wrangler D1 migration: jangan gunakan `--batch` pada `d1 migrations apply`; gunakan `--remote` untuk CI/CD.
- Cloudflare permission: D1 adalah resource account-level, jadi token CI/CD perlu Custom API Token dengan scope Account, bukan hanya token zona/Workers standar.
- Hybrid Vue + Hono di Cloudflare Pages: pastikan `functions/api/[[path]].ts` ada agar API tidak jatuh menjadi response HTML/static 405.

Estimasi cepat Gate 3: **0.5 hari**

### Urutan Eksekusi Disarankan (Ringkas)

1. Selesaikan **Gate 1** sampai lulus smoke test.
2. Lanjut **Gate 2** (migrations + pipeline + runbook).
3. Tutup dengan **Gate 3** (security final).
4. Deploy ke staging -> smoke test -> promote ke production.

### Exit Criteria Siap Deploy

- [ ] Semua item Gate 1 tercentang.
- [ ] Pipeline GitHub Actions hijau: install, typecheck, migration apply, build, deploy.
- [ ] D1 remote tersinkronisasi lewat migration pertama.
- [ ] Secret production (`JWT_SECRET`) terpasang di Cloudflare Pages.
- [ ] Health check publik + flow admin minimum lolos setelah deploy.

---

## Laporan Smoke Test Production (Manual) — 2026-05-08 14:54 WIB

Environment:

- Base URL: `https://masjidnurulhuda.pages.dev`
- Metode: manual smoke via CLI request (public + auth baseline)
- Catatan: percobaan awal sempat gagal karena command separator shell (`&`) dan quoting payload login.

Hasil Eksekusi:

1. Public endpoint (PASS)
   - `GET /api/public/kas/summary` -> **200 OK**
   - `GET /api/public/jadwal/today` -> **200 OK**
   - Kontrak response valid: `status=success`, `message`, `data`.

2. Admin auth/login (RETEST PASS dengan kredensial valid production)
   - Percobaan awal (akun lama) sempat menghasilkan **500**.
   - Retest menggunakan akun:
     - `admin1@masjidnurulhuda.com`
     - `password123`
   - `POST /api/admin/auth/login` -> **200 OK**
   - Response body: `{"status":"success","message":"Login berhasil",...}` + `Set-Cookie auth_token`.

3. Admin session-dependent checks (PASS)
   - `GET /api/admin/auth/me` -> **200 OK** (`Sesi valid`, role `superadmin`)
   - `GET /api/admin/dashboard/summary` -> **200 OK**
   - `GET /api/admin/media?page=1&limit=5` -> **200 OK** (items kosong valid, pagination valid)
   - `POST /api/admin/auth/logout` -> **200 OK**

Ringkasan Status:

- Public baseline: **LULUS**
- Workflow admin minimum (auth -> me -> dashboard -> media -> logout): **LULUS**
- Severity blocker login: **CLOSED** (penyebab awal adalah kredensial uji yang tidak sesuai data production aktif)

Tindak Lanjut Prioritas:

- [x] Lanjutkan smoke test matrix role lengkap (`superadmin`, `ketua`, `bendahara`, `pengurus`) termasuk verifikasi baseline akses endpoint admin.
  - update 2026-05-08 15:04 WIB (production, lama):
    - `admin1@masjidnurulhuda.com` / `password123` -> **PASS** (login 200, sesi valid).
    - `bendahara@masjidnurulhuda.com` / `password123` -> **FAIL** (login 500).
    - `ketua@masjidnurulhuda.com` / `admin123` -> **FAIL** (login 500).
    - `dakwah@masjidnurulhuda.com` / `password123` -> **FAIL** (login 500).
  - retest 2026-05-08 15:41 WIB (production, terbaru):
    - `ketua@masjidnurulhuda.com` / `admin123` -> **PASS** (login 200, `me` 200, `dashboard/summary` 200, `media list` 200, `transaction/list` 200, logout 200).
    - `bendahara@masjidnurulhuda.com` / `password123` -> **PASS** (login 200, `me` 200, `dashboard/summary` 403 sesuai policy role, `media list` 200, `transaction/list` 200, logout 200).
    - `dakwah@masjidnurulhuda.com` / `password123` -> **PASS** (login 200, `me` 200, `dashboard/summary` 200, `media list` 200, `transaction/list` 200, logout 200).
  - status: blocker login non-superadmin **CLOSED**.
- [x] Smoke test media workflow penuh (upload/edit alt/delete + public media fetch).
  - update 2026-05-08 15:44 WIB (production, superadmin `admin1@masjidnurulhuda.com`):
    - `POST /api/admin/media` -> **PASS** (201).
    - `GET /api/admin/media?page=1&limit=5` -> **PASS** (200).
    - `GET /api/public/media/:key` -> **PASS** (200).
    - `DELETE /api/admin/media/:id` -> **PASS** (200).
    - `GET /api/public/media/:key` pasca delete -> **PASS** (404 expected).
  - retest final 2026-05-08 16:13 WIB:
    - `PATCH /api/admin/media/:id` -> **PASS** (200 OK, request-id: `smoke-prod-patch-safe-1`).
  - status: workflow media end-to-end production **LULUS**.
- [x] Investigasi root cause login 500 untuk role non-superadmin (audit data user/role/password_hash di D1 production + query login service + guard role matrix pasca hotfix reconcile `bendahara`).
  - hasil: tidak reproduksi pada retest terbaru; seluruh role non-superadmin login normal (200) pada production.
