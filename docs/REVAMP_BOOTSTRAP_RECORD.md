# Record Bootstrap Workspace dan Environment Revamp

Tanggal eksekusi: 1 Agustus 2026 WIB.

## Tujuan

Mempreservasi current R4 sebagai checkpoint dan menyiapkan lane full revamp yang tidak berbagi Pages, D1, R2, atau secret runtime dengan testing maupun production.

## Checkpoint source

- Branch preservasi: `redesign/current-r4`.
- Branch revamp: `revamp/full-product`.
- Workspace current: `C:\WORK\Projects\Web_Apps\masjidnurulhuda`.
- Workspace revamp: `C:\WORK\Projects\Web_Apps\masjidnurulhuda-revamp`.
- SHA checkpoint: `15b013e697bd576b1eeda3216dfa6b1b601fba5c`;
- GitHub Actions revamp run: `30663081774` (`verify` dan `deploy` lulus);
- deployment immutable: `https://35b6c65d.masjidnurulhuda-revamp.pages.dev`;
- alias stabil: `https://masjidnurulhuda-revamp.pages.dev`.

Checkpoint merupakan late snapshot R4, bukan penerimaan arah visual current dan bukan penutupan R4.

## Resource Cloudflare revamp

Resource baru yang dibuat:

- Pages: `masjidnurulhuda-revamp`;
- alias: `https://masjidnurulhuda-revamp.pages.dev`;
- D1: `masjidnurulhuda-revamp-db`;
- D1 ID: `d2dd9b3b-60d6-40c9-b181-dd2c910fdba4`;
- region D1: APAC;
- R2: `masjidnurulhuda-revamp-media`;
- config: `wrangler.revamp.toml`;
- GitHub Environment: `revamp`, custom branch policy hanya `revamp/full-product`;
- runtime `JWT_SECRET`: dibuat acak dan dipasang langsung sebagai encrypted Pages secret; nilainya tidak dicetak atau disimpan.

Binding aplikasi tetap `DB` dan `MEDIA_BUCKET`.

## Evidence D1 remote

`npx wrangler d1 migrations apply masjidnurulhuda-revamp-db --remote --config wrangler.revamp.toml` berhasil menerapkan migration `0001`–`0018`.

Read-only verification setelah apply:

- `d1_migrations`: 18;
- transaksi `kas_masjid`: 0;
- akun aktif hasil fresh migration: 0;
- `PRAGMA foreign_key_check`: tidak menghasilkan row.

Tidak ada data testing atau production yang disalin ke D1 revamp.

## Gate checkpoint lokal

Setelah edit final:

- `npm run test`: 176/176 lulus;
- `npm run build`: lulus;
- `npm run test:migrations`: 18 migration, backfill `keperluan`, preservasi data, FK aktif-bersih;
- `npm run test:critical-flow:d1`: lulus, concurrency `1×200 + 1×409`, ownership isolated, summary konsisten, fixture cleanup 0;
- `npm run test:e2e:browser`: lulus pada 360×800, 768×1024, 1024×1366, dan 1366×900;
- real Vite→Hono `GET /api/public/hello`: HTTP 200 JSON;
- `git diff --cached --check`: lulus;
- staged path dan credential-pattern scan: tidak menemukan secret/artifact.

Audit E2E menemukan dan menutup bug boundary waktu: tanggal default form sebelumnya memakai UTC sementara filter periode tidak memakai snapshot WIB yang sama. `useKasState.ts` kini memakai `Asia/Jakarta` untuk tanggal dan periode, dengan regression test `tests/kas-wib-state.test.mjs`.

## Hygiene artifact

Evidence historis berikut dipertahankan di disk tetapi di-ignore:

- `.hermes/artifacts/`;
- `.hermes/*.mjs`;
- `.hermes/*-experiments/` dan folder eksperimen R3/R4.

Dua file ekspresi browser yang tidak sengaja dibuat (`document.documentElement.clientWidth` dan `x.name)`) dihapus. Tidak ada `.env`, `.dev.vars`, cookie, local DB, screenshot, atau secret yang masuk checkpoint.

## Production non-touch

Bootstrap ini tidak:

- mengubah branch `main`;
- menjalankan migration pada `masjidnurulhuda-db`;
- menulis ke `masjidnurulhuda-media`;
- deploy ke Pages `masjidnurulhuda`;
- mengubah secret production.

## Evidence deployment dan isolation

- branch `redesign/current-r4`, `revamp/full-product`, dan `improve/project-foundation` remote menunjuk checkpoint `15b013e`;
- kedua worktree bersih dan memakai dependency directory masing-masing;
- workflow revamp mengeksekusi quality gate, migration D1 revamp, isolated workspace, dan Pages deploy tanpa menyentuh config production;
- deployment list Cloudflare mengikat branch `revamp/full-product`, source `15b013e`, dan deployment immutable `35b6c65d`;
- immutable dan alias sama-sama HTTP 200 untuk homepage, `/api/public/hello`, dan `/api/public/kas/summary`;
- immutable dan alias menyajikan entry asset `/assets/index-frpCr1jb.js` yang sama;
- browser smoke 360×800 pada immutable dan alias menampilkan brand, tidak overflow, serta tidak menghasilkan console/page error;
- D1 fingerprint `transaction_count=0`, `saldo=0`, migration count 18, dan FK bersih cocok dengan API revamp (`total_saldo=0`, pemasukan/pengeluaran bulan ini 0).

## Dependency hardening dan deployment terbaru

Audit dependency saat bootstrap melaporkan 14 advisory (`2 low`, `4 moderate`, `8 high`). Triage dependency terkontrol berikutnya menurunkan hasil menjadi 2 residual moderate dari satu akar adapter development Hono tanpa fix kompatibel, tanpa `npm audit fix --force`; klasifikasi reachability, compensating control, dan evidence gate dicatat di `docs/DEPENDENCY_SECURITY_AUDIT.md`.

- Commit dependency final: `67fef24` (`chore: harden revamp dependencies`).
- GitHub Actions revamp run `30755596166`: job `verify` dan `deploy` lulus.
- Deployment immutable terbaru: `https://3e08824d.masjidnurulhuda-revamp.pages.dev`; alias stabil: `https://masjidnurulhuda-revamp.pages.dev`.
- Immutable dan alias menyajikan entry asset `/assets/index-DlMJFg1Y.js` yang sama serta HTTP 200 untuk homepage dan API publik utama.
- D1 fingerprint tetap `transaction_count=0`, `saldo=0`, migration count 18, dan FK bersih; API revamp cocok dengan fingerprint tersebut.

## Superadmin revamp

Superadmin pertama telah diprovision langsung ke `masjidnurulhuda-revamp-db`: email `superadmin@masjidnurulhuda.com`, nama `Super Admin`, role/operational role `superadmin`, dan status aktif. Credential tidak disimpan dalam Git, dokumentasi, chat, atau log. Command canonical `npm run admin:provision:revamp` hard-bound ke D1/config revamp dan memakai temporary SQL file yang dihapus saat cleanup. Password dikelola operator di storage lokal ignored; gunakan `-- --replace-existing` hanya untuk recovery eksplisit.
