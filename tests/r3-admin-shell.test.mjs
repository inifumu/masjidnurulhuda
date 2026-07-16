import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("R3 admin shell memakai primitive canonical, density compact, dan nav role-aware", async () => {
  const [layout, sidebar] = await Promise.all([
    read("src/layouts/AdminLayoutV2.vue"),
    read("src/components/admin/shell/AdminSidebar.vue"),
  ]);
  const shell = `${layout}\n${sidebar}`;
  assert.match(layout, /SidebarProvider/);
  assert.match(sidebar, /collapsible="icon"/);
  assert.match(sidebar, /SidebarMenuSub/);
  assert.match(sidebar, /Collapsible/);
  assert.match(sidebar, /visibleNavigationGroups/);
  assert.match(sidebar, /roles: \["superadmin", "ketua"\]/);
  assert.match(layout, /SidebarTrigger/);
  assert.match(sidebar, /SidebarFooter/);
  assert.match(sidebar, /data-account-trigger/);
  assert.match(layout, /data-theme-trigger/);
  assert.doesNotMatch(shell, /Sheet v-model:open="isMobileSheetOpen"|isDesktopSidebarOpen|isMobileSheetOpen|backdrop-blur|#09090b|w-8 h-8/);
});

test("server-authorized role impersonation memakai backend session dan indikator permanen", async () => {
  const [layout, sidebar, store, authRoute] = await Promise.all([
    read("src/layouts/AdminLayoutV2.vue"), read("src/components/admin/shell/AdminSidebar.vue"),
    read("src/stores/authStore.ts"), read("server/api/admin/auth.ts"),
  ]);
  assert.match(sidebar, /Lihat dan bertindak sebagai/);
  assert.match(layout, /data-impersonation-banner/);
  assert.match(layout, /actor_name/);
  assert.match(store, /\/api\/admin\/auth\/impersonation\/start/);
  assert.match(store, /\/api\/admin\/auth\/impersonation\/stop/);
  assert.match(authRoute, /role_impersonation_started/);
  assert.doesNotMatch(store, /localStorage|previewRole/);
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
