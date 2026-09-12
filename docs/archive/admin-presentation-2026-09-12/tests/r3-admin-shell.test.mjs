import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("admin shell produksi memakai PrimeVue 5, Lentera, ripple, dan navigasi role-aware", async () => {
  const [app, main, layout, navigation, login, theme, shellTheme, css, pkg] = await Promise.all([
    read("src/App.vue"),
    read("src/main.ts"),
    read("src/layouts/AdminLayoutV2.vue"),
    read("src/components/admin/shell/PrimeAdminNavigation.vue"),
    read("src/views/admin/LoginV2.vue"),
    read("src/primevue/theme.ts"),
    read("src/composables/admin/useAdminShellTheme.ts"),
    read("src/assets/admin-primevue.css"),
    read("package.json"),
  ]);
  const shell = `${layout}\n${navigation}\n${theme}\n${shellTheme}`;
  assert.match(pkg, /"primevue": "\^5\.0\.0"/);
  assert.match(layout, /primevue\/popover/);
  assert.match(layout, /PrimeAdminNavigation/);
  assert.match(navigation, /primevue\/dock/);
  assert.match(navigation, /primevue\/drawer/);
  assert.match(navigation, /roles: \["superadmin", "ketua"\]/);
  assert.match(navigation, /roles: \["superadmin"\]/);
  assert.match(layout, /admin-profile-trigger/);
  assert.match(layout, /position="bottom-right"/);
  assert.match(layout, /admin-toast-stack/);
  assert.match(layout, /:aria-expanded="isProfileOpen"/);
  assert.match(layout, /Gaya ruang kerja/);
  assert.match(theme, /@primeuix\/themes\/aura/);
  assert.doesNotMatch(theme, /aura-compat|as any|brand:/);
  assert.match(css, /--admin-control-height: 40px/);
  assert.match(css, /--admin-radius-control: 10px/);
  assert.match(css, /\.admin-toast-stack\.p-toast/);
  assert.match(css, /\.p-tooltip \.p-tooltip-text/);
  assert.match(css, /\.p-ink \{\s*background: currentColor/);
  assert.doesNotMatch(css, /\.p-ink \{\s*display: none/);
  assert.match(css, /p-button\.p-button-danger:is\(\.p-button-text, \.p-button-outlined\):hover/);
  assert.match(css, /html\[data-admin-shell="lentera"\] \.admin-lentera-dock \.p-dock-list-container/);
  assert.match(css, /\.admin-submenu-links \{\s*grid-template-columns: repeat\(3/);
  assert.match(css, /\.admin-submenu-popover\.p-popover-flipped::after/);
  assert.match(css, /inset-inline-start: 0 !important/);
  assert.match(css, /\.admin-breadcrumb \{[\s\S]*?position: absolute/);
  assert.match(css, /data-admin-shell="sanggar"\]\[data-admin-sanggar="collapsed"\]/);
  assert.match(css, /\.admin-drawer-primary/);
  assert.match(css, /\.admin-drawer-children/);
  assert.match(css, /\.admin-select-overlay \.p-select-option/);
  assert.match(css, /\.p-datatable-header-cell/);
  assert.doesNotMatch(navigation, /\/admin\/(?:dashboard|finance|media|galeri-dokumentasi)/);
  assert.match(navigation, /planned: true/);
  assert.match(navigation, /railTooltip/);
  assert.match(navigation, /submenu\.value\?\.toggle\(event\)/);
  assert.match(navigation, /submenuPointerX/);
  assert.match(navigation, /triggerRect\.left \+ \(triggerRect\.width \/ 2\)/);
  assert.match(navigation, /--admin-submenu-pointer-x/);
  assert.match(navigation, /toggleSanggarSidebar/);
  assert.match(navigation, /Ciutkan navigasi/);
  assert.doesNotMatch(navigation, /Sistem operasional|admin-live-dot/);
  assert.match(navigation, /Tutup navigasi/);
  assert.match(navigation, /admin-drawer-navigation/);
  assert.doesNotMatch(navigation, /drawerMode/);
  assert.match(navigation, /v-ripple/);
  assert.match(layout, /v-ripple/);
  assert.match(login, /v-ripple/);
  assert.match(main, /ripple: true/);
  assert.match(main, /primevue\/ripple/);
  assert.match(main, /app\.directive\("ripple", Ripple\)/);
  assert.doesNotMatch(main, /vue-sonner/);
  assert.match(app, /primevue\/progressspinner/);
  assert.doesNotMatch(app, /vue-sonner|<Toaster/);
  assert.match(shellTheme, /"sanggar" \| "menara" \| "lentera"/);
  assert.match(shellTheme, /:\s*"lentera",/);
  assert.match(shellTheme, /SanggarNavigationMode = "expanded" \| "collapsed"/);
  assert.match(shellTheme, /nurul-huda-sanggar-navigation/);
  assert.match(shellTheme, /startViewTransition/);
  assert.match(shellTheme, /runFallbackThemeTransition/);
  assert.match(shellTheme, /surface\.animate/);
  assert.match(shellTheme, /prefers-reduced-motion: reduce/);
  assert.match(css, /grid-template-columns 260ms cubic-bezier/);
  assert.match(css, /transition-delay: 70ms/);
  assert.match(css, /::view-transition-old\(root\)/);
  assert.doesNotMatch(shell, /serambi/i);
  assert.doesNotMatch(layout, /SidebarProvider|SidebarTrigger|AdminSidebar/);
});

test("server-authorized role impersonation memakai backend session dan indikator permanen", async () => {
  const [layout, store, authRoute] = await Promise.all([
    read("src/layouts/AdminLayoutV2.vue"),
    read("src/stores/authStore.ts"),
    read("server/api/admin/auth.ts"),
  ]);
  assert.match(layout, /Pratinjau akses/);
  assert.match(layout, /data-impersonation-banner/);
  assert.match(layout, /actor_name/);
  assert.match(store, /\/api\/admin\/auth\/impersonation\/start/);
  assert.match(store, /\/api\/admin\/auth\/impersonation\/stop/);
  assert.match(authRoute, /role_impersonation_started/);
  assert.doesNotMatch(store, /localStorage|previewRole/);
});

test("login PrimeVue membedakan credential, rate limit, dan operational error", async () => {
  const [login, store] = await Promise.all([
    read("src/views/admin/LoginV2.vue"),
    read("src/stores/authStore.ts"),
  ]);
  assert.match(login, /error\.status === 429/);
  assert.match(login, /error\.status === 401/);
  assert.match(login, /Layanan autentikasi belum dapat dijangkau/);
  assert.match(login, /primevue\/inputtext/);
  assert.match(login, /primevue\/password/);
  assert.match(login, /autocomplete="username"/);
  assert.match(login, /autocomplete="current-password"/);
  assert.match(login, /adminShellThemes/);
  assert.match(login, /\/admin\/pengaturan\/kategori-kas/);
  assert.doesNotMatch(login, /FormField|@\/components\/ui/);
  assert.match(store, /httpClient<AuthSuccess>/);
});

test("Pengaturan menjadi tiga child route nyata dengan guard backend-aligned", async () => {
  const [router, resource] = await Promise.all([
    read("src/router/index.ts"),
    read("src/components/admin/settings/SettingsResourcePage.vue"),
  ]);
  assert.match(router, /path: "kategori-kas"/);
  assert.match(router, /path: "seksi-pengurus"/);
  assert.match(router, /path: "akun-akses"/);
  assert.match(router, /roles: \["superadmin", "ketua"\]/);
  assert.match(router, /roles: \["superadmin"\]/);
  assert.match(resource, /pengaturanService\.loadByTab/);
  assert.match(resource, /pengaturanService\.saveByTab/);
  assert.match(resource, /pengaturanService\.setUserActive/);
  assert.match(resource, /overlay-class="admin-select-overlay"/);
  assert.doesNotMatch(resource, /PengaturanLegacyBridge/);
});
