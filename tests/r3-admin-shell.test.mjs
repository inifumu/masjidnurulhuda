import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("R3 admin shell memakai primitive canonical dan nav role-aware", async () => {
  const shell = await read("src/layouts/AdminLayoutV2.vue");
  assert.match(shell, /Sheet v-model:open="isMobileSheetOpen"/);
  assert.match(shell, /visibleNavItems/);
  assert.match(shell, /roles: \["superadmin", "ketua"\]/);
  assert.match(shell, /aria-label="Navigasi admin"/);
  assert.doesNotMatch(shell, /backdrop-blur|#09090b|Galeri & Dokumentasi|w-8 h-8/);
});

test("R3 login membedakan credential, rate limit, dan operational error", async () => {
  const [login, store] = await Promise.all([read("src/views/admin/LoginV2.vue"), read("src/stores/authStore.ts")]);
  assert.match(login, /error\.status === 429/);
  assert.match(login, /error\.status === 401/);
  assert.match(login, /Layanan autentikasi belum dapat dijangkau/);
  assert.match(login, /FormField/);
  assert.match(login, /autocomplete="username"/);
  assert.match(login, /autocomplete="current-password"/);
  assert.doesNotMatch(login, /backdrop-blur|blur-3xl|cta-pulse|rounded-3xl/);
  assert.match(store, /httpClient<AuthSuccess>/);
});
