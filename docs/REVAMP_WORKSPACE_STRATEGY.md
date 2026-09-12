# Strategi Workspace Full Revamp

> **Batas aktif:** Dokumen ini hanya mengatur topology Git/worktree, sinkronisasi behavior/security, dan isolasi Cloudflare. Dokumen ini bukan sumber desain, discovery, prototype, atau urutan implementasi. Untuk arah aktif gunakan `DESIGN.md`, `docs/ADMIN_REVAMP_PRD.md`, dan planning di `.hermes/plans/`.

## Keputusan

Full revamp tidak menggantikan atau menghapus checkpoint R4 yang sudah ada. Repository memakai satu Git history dengan dua jalur kerja dan dua direktori fisik melalui Git worktree:

State saat dokumen ini pertama kali ditulis: perubahan checkpoint masih berada pada branch `improve/project-foundation` di workspace existing dan kedua branch target belum dibuat. Tabel berikut adalah topology target yang baru berlaku setelah checkpoint terverifikasi di-commit, branch preservasi dibuat, dan worktree revamp ditambahkan dari SHA yang sama.

| Jalur | Branch | Workspace | Fungsi |
|---|---|---|---|
| Historical checkpoint | `redesign/current-r4` | `C:\WORK\Projects\Web_Apps\masjidnurulhuda` | Preservasi snapshot source untuk recovery dan behavior/security evidence; bukan donor atau pembanding visual |
| Full revamp | `revamp/full-product` | `C:\WORK\Projects\Web_Apps\masjidnurulhuda-revamp` | Presentation layer baru dari nol dengan behavior/API/RBAC/audit/idempotency sebagai regression contract |

Branch `main`, resource production, dan history yang sudah ada tidak diubah oleh pemisahan workspace ini.

## Arti checkpoint

Checkpoint current R4 adalah snapshot terverifikasi dari working tree yang sebelumnya besar dan mixed. Checkpoint:

- mempertahankan source snapshot untuk behavior, migration, test, recovery, dan histori;
- bukan pernyataan bahwa desain current diterima sebagai arah final;
- bukan penutupan R4;
- menjadi titik asal branch revamp agar kontrak terbaru tidak perlu diimplementasikan ulang;
- menyimpan UI current sebagai bagian snapshot recovery; UI tersebut tidak boleh dibuka sebagai pembanding atau donor pada fase blank-canvas exploration.

Artifact browser/probe lokal di `.hermes/artifacts/`, `.hermes/*.mjs`, dan folder eksperimen tetap berada di disk tetapi di-ignore oleh Git. Artifact tersebut tidak boleh ikut checkpoint atau deployment.

## Kontrak full revamp

Full revamp berarti membuat ulang presentation layer dari nol. Agent atau developer pada branch revamp wajib:

1. mengikuti blank-canvas sequence pada planning aktif: visual brief → beberapa direction baru → render → pilihan pengguna → design system baru;
2. tidak membaca UI/source current sebagai input visual sebelum direction dan design system baru disetujui;
3. tidak membawa font, token, angka, density, breakpoint, component, framework, layout, navigation, atau responsive pattern current;
4. hanya memakai emerald/yellow-gold logo dan brief pengguna sebagai input visual;
5. setelah design approval, memetakan behavior/API/RBAC/security dari source snapshot tanpa mengubah arah visual;
6. mempertahankan API, backend policy, RBAC, ownership, audit, idempotency, migration, state machine, dan critical-flow tests saat integrasi;
7. mengikuti urutan implementation Login → shell admin → Pengaturan → Galeri → Keuangan → Dashboard, dengan Dashboard terakhir;
8. tidak merge seluruh branch historical checkpoint ke revamp setelah kedua jalur berpisah.

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

Status 2 Agustus 2026: seluruh gate workspace/environment di atas `Done`. Status ini tidak menyetujui desain snapshot. Tahap aktif mengikuti blank-canvas planning terbaru; urutan IA/journey/prototype lama telah dibatalkan.
