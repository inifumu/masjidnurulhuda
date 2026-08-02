# Audit Keamanan Dependency Revamp

Tanggal audit: 2 Agustus 2026 WIB.
Scope: branch `revamp/full-product`; tidak mencakup perubahan visual, migration remote, secret, production, atau testing.

## Hasil

Baseline `npm audit`: 14 vulnerability (`2 low`, `4 moderate`, `8 high`, `0 critical`).
Hasil akhir: 2 vulnerability moderate, 0 high/critical. Audit belum bersih karena keduanya berasal dari satu advisory upstream development adapter tanpa fix kompatibel.

Upgrade langsung:

- `hono` `4.12.14` → `4.12.33` (runtime production);
- `vite` `8.0.8` → `8.2.0` (development/build);
- `wrangler` `4.111.0` → `4.118.0` (development, local D1/Pages tooling);
- `@hono/vite-dev-server` `0.25.1` → `0.26.1` (development adapter latest).

`shadcn-vue` dipertahankan karena build CSS mengimpor `shadcn-vue/tailwind.css`; primitive canonical lainnya tetap tersimpan sebagai source di `src/components/ui`. Upgrade ke `2.8.1` dan resolusi lockfile fresh memilih transitive aman untuk `@babel/core`, `fast-uri`, `@modelcontextprotocol/sdk`, `body-parser`, dan `qs`, sehingga advisory tersebut hilang tanpa override major.

Override terbatas hanya untuk `brace-expansion` `2.1.3`, patch aman dalam major line yang diminta `minimatch` milik adapter dev Hono.

Compatibility divalidasi melalui dependency tree, full unit/integration suite, production build, migration harness, real-D1 critical flow, Chromium E2E, dan real Vite→Hono request. Tidak digunakan `npm audit fix --force`.

## Klasifikasi

| Package/path | Klasifikasi dan reachability | Status/control |
|---|---|---|
| `hono` | Runtime production reachable melalui Pages Functions dan auth/JWT/API. | Diperbaiki ke `4.12.33`; seluruh advisory Hono baseline hilang. |
| `vite` | Development/build-only; dev server tidak diekspos sebagai production runtime. | Diperbaiki ke `8.2.0`. |
| `wrangler → miniflare → sharp` | Development/test/deploy tooling; bukan runtime Pages hasil deploy. | Diperbaiki melalui Wrangler `4.118.0`; advisory Miniflare/Sharp hilang. |
| `postcss` | Build tooling; memproses CSS repository, bukan input pengguna runtime. | Upstream aman; advisory hilang. |
| `@hono/vite-dev-server → minimatch → brace-expansion` | Dev-only glob expansion; tidak ada input publik runtime. | Diperbaiki dengan patch-line override `2.1.3` yang kompatibel dan diuji. |
| `shadcn-vue` dan transitive CLI/MCP | Stylesheet package dipakai build; generator/MCP-nya tooling-only dan tidak diimpor Functions runtime. | Dipertahankan pada `2.8.1`; lockfile fresh memilih transitive aman dan jalur advisory Babel/MCP/Ajv/Express hilang. |

## Residual

| Package/path | Reachability | Alasan belum diperbaiki dan compensating control |
|---|---|---|
| `@hono/node-server@1.19.14` | Development-only melalui `@hono/vite-dev-server`; production memakai Cloudflare Pages/Workers. Advisory traversal berlaku pada Windows `serve-static`, sedangkan project memakai Cloudflare adapter, hanya memasukkan `/api`, dan tidak mengimpor `@hono/node-server/serve-static`. | Fix memerlukan `@hono/node-server >=2.0.5`, tetapi adapter latest `@hono/vite-dev-server@0.26.1` masih meminta `^1.19.11`. Major override tidak dipakai karena melanggar kontrak consumer. Dev server wajib bind loopback dan hanya memakai trusted workspace; jangan dipublikasikan ke jaringan. |
| `@hono/vite-dev-server@0.26.1` | Parent advisory development-only dari node-server di atas; bukan vulnerability independen runtime Cloudflare. | Sudah latest. Tunggu upstream mengadopsi node-server 2; control sama: loopback-only, trusted workspace, tanpa static untrusted root. |

## Gate wajib

Evidence final mencakup:

- `npm run test`;
- `npm run build`;
- `npm run test:migrations`;
- `npm run test:critical-flow:d1`;
- `npm run test:e2e:browser`;
- real Vite→Hono `GET /api/public/hello`;
- `npm audit --json` dan dependency tree final;
- independent pre-commit review;
- CI serta smoke deployment revamp immutable dan alias.

Production/testing tetap non-touch. Binding revamp harus tetap `masjidnurulhuda-revamp-db` dan `masjidnurulhuda-revamp-media` melalui `wrangler.revamp.toml`.
