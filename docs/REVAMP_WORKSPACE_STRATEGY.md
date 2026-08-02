# Strategi Workspace Full Revamp

## Keputusan

Full revamp tidak menggantikan atau menghapus checkpoint R4 yang sudah ada. Repository memakai satu Git history dengan dua jalur kerja dan dua direktori fisik melalui Git worktree:

State saat dokumen ini pertama kali ditulis: perubahan checkpoint masih berada pada branch `improve/project-foundation` di workspace existing dan kedua branch target belum dibuat. Tabel berikut adalah topology target yang baru berlaku setelah checkpoint terverifikasi di-commit, branch preservasi dibuat, dan worktree revamp ditambahkan dari SHA yang sama.

| Jalur | Branch | Workspace | Fungsi |
|---|---|---|---|
| Current R4 | `redesign/current-r4` | `C:\WORK\Projects\Web_Apps\masjidnurulhuda` | Preservasi implementasi Transaksi, Catat kas, dan Proposal; hanya menerima perbaikan behavior/security yang memang diperlukan |
| Full revamp | `revamp/full-product` | `C:\WORK\Projects\Web_Apps\masjidnurulhuda-revamp` | Presentation layer baru dari nol dengan behavior/API/RBAC/audit/idempotency sebagai regression contract |

Branch `main`, resource production, dan history yang sudah ada tidak diubah oleh pemisahan workspace ini.

## Arti checkpoint

Checkpoint current R4 adalah snapshot terverifikasi dari working tree yang sebelumnya besar dan mixed. Checkpoint:

- mempertahankan seluruh behavior, migration, test, dokumentasi, dan UI R4 yang masih berguna;
- bukan pernyataan bahwa desain current diterima sebagai arah final;
- bukan penutupan R4;
- menjadi titik asal branch revamp agar kontrak terbaru tidak perlu diimplementasikan ulang;
- menyimpan UI current hanya sebagai inventory behavior dan pembanding, bukan donor visual revamp.

Artifact browser/probe lokal di `.hermes/artifacts/`, `.hermes/*.mjs`, dan folder eksperimen tetap berada di disk tetapi di-ignore oleh Git. Artifact tersebut tidak boleh ikut checkpoint atau deployment.

## Kontrak full revamp

Full revamp berarti membuat ulang presentation layer dari nol. Agent atau developer pada branch revamp wajib:

1. memulai dari product brief, information architecture, user journey, dan prototype struktural;
2. memperlakukan UI current/legacy/V2 hanya sebagai inventory behavior, data, role, error state, dan invariant;
3. tidak menyalin hierarchy, layout, grouping, spacing, card composition, atau interaction model current hanya agar pekerjaan lebih cepat;
4. membuat minimal dua arah prototype yang berbeda secara struktural sebelum mengubah route production;
5. meminta pilihan visual pengguna berdasarkan render browser nyata;
6. mempertahankan API, backend policy, RBAC, ownership, audit, idempotency, migration, state machine, dan critical-flow tests;
7. tidak membuat suffix `V3` atau visual bridge baru;
8. tidak merge seluruh branch current ke revamp setelah kedua jalur berpisah.

## Sinkronisasi antarjalur

Perubahan berikut dapat dipindahkan dari satu jalur ke jalur lain melalui commit kecil dan `git cherry-pick`:

- security fix;
- migration dan data-integrity fix;
- RBAC/ownership correction;
- API/shared-contract correction;
- idempotency/concurrency fix;
- regression test critical flow.

Perubahan berikut tidak disinkronkan otomatis:

- layout dan visual token;
- page composition;
- responsive interaction;
- prototype;
- spacing dan styling;
- copy yang khusus pada arah desain tertentu.

Hindari perubahan paralel tanpa koordinasi pada `shared/contracts/`, `server/api/admin/transaction.ts`, `server/services/transaction.ts`, `migrations/`, `src/services/admin/kasService.ts`, dan `src/composables/admin/kas/`.

## Topologi Cloudflare

Revamp memakai lane live sendiri dan tidak memakai D1/R2 testing maupun production:

| Branch | GitHub Environment | Pages | D1 | R2 | Config |
|---|---|---|---|---|---|
| `revamp/full-product` | `revamp` | `masjidnurulhuda-revamp` | `masjidnurulhuda-revamp-db` | `masjidnurulhuda-revamp-media` | `wrangler.revamp.toml` |
| `testing` | `testing` | `masjidnurulhuda-testing` | `masjidnurulhuda-testing-db` | `masjidnurulhuda-testing-media` | `wrangler.testing.toml` |
| `main` | `production` | `masjidnurulhuda` | `masjidnurulhuda-db` | `masjidnurulhuda-media` | `wrangler.toml` |

Binding source tetap bernama `DB` dan `MEDIA_BUCKET`. Deployment revamp wajib memakai isolated temporary workspace agar Pages Functions tidak membaca `wrangler.toml` production saat bundling.

## Aturan operasional

- Jalankan dev server current dan revamp pada port berbeda.
- Setiap worktree memiliki `node_modules` sendiri melalui `npm install`/`npm ci`.
- Jangan berbagi state D1 lokal ketika dua server atau test suite berjalan bersamaan; gunakan Wrangler persistence/disposable state terpisah.
- Simpan screenshot/evidence sementara di luar repository atau folder ignored yang telah diverifikasi.
- Jangan menjalankan migration/deploy production dari workspace revamp.
- Jangan menyalin akun atau data production ke D1 revamp.
- Superadmin revamp diprovision terpisah dengan credential pilihan operator dan tidak disimpan dalam source/chat/log.

## Gate awal revamp

Workspace revamp baru dinyatakan siap ketika:

- checkpoint current telah committed dan dipush;
- kedua worktree bersih dan berada pada branch yang benar;
- config/workflow revamp mengikat resource yang berbeda dari testing dan production;
- D1 revamp menerima seluruh migration fresh dan foreign-key check bersih;
- Pages revamp memiliki `JWT_SECRET` unik;
- deploy revamp berhasil dari isolated workspace;
- URL immutable dan alias revamp memberi HTTP/API response sehat;
- fingerprint API revamp cocok dengan D1 revamp;
- resource production tidak berubah.

Status 2 Agustus 2026: seluruh gate awal di atas `Done`. Dependency hardening, CI/deploy commit-spesifik, alias/immutable smoke, D1/API fingerprint, dan provisioning superadmin revamp telah selesai. Tahap aktif berikutnya adalah planning full revamp: product brief → information architecture → user journey → minimal dua prototype struktural → pilihan visual pengguna → implementasi presentation layer bertahap.
