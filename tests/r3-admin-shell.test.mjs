import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");
const canonical = (source) => source.replace(/\r\n/g, "\n");
const sha256 = (source) => createHash("sha256").update(source).digest("hex");
const REKA_MAIA_SIDEBAR_INSET_SHA256 = "f6bfc89eb688ddffcd3f39548fb21b3f7ca1ee843c8a5b5370c9630d4032d0e6";
const REKA_MAIA_SIDEBAR_INDEX_SHA256 = "c600c486a191807c93b4b87d86e207cf77e65862872b33b8941c83c396d759a2";
const REKA_MAIA_SIDEBAR_MENU_BUTTON_CHILD_SHA256 = "d4227843e80860a8eac8f516aa832ca2e57d5ea7910550b36ad93db152f94ed7";

test("admin has dedicated style entry and preserves public document isolation", async () => {
  const main = await read("src/main.ts");
  const router = await read("src/router/index.ts");
  const adminStyles = await read("src/adminStyles.ts");
  const adminCss = await read("src/assets/admin.css");

  assert.match(main, /applyAdminTheme\(\)/);
  assert.match(main, /await import\("\.\/adminStyles"\)/);
  assert.match(main, /await import\("\.\/publicStyles"\)/);
  assert.match(router, /window\.location\.assign\(to\.fullPath\)/);
  assert.match(adminStyles, /\.\/assets\/admin\.css/);
  assert.match(adminCss, /@import "tailwindcss"/);
  assert.match(adminCss, /@import "tw-animate-css"/);
  assert.match(adminCss, /prefers-reduced-motion/);
  assert.match(adminCss, /--color-sidebar-accent: var\(--sidebar-accent\)/);
  assert.match(adminCss, /--color-sidebar-border: var\(--sidebar-border\)/);
  assert.doesNotMatch(adminCss, /https:\/\/fonts\.googleapis\.com/);
});

test("admin presentation has no legacy visual imports or inline color literals", async () => {
  const paths = [
    "src/layouts/AdminLayoutV2.vue",
    "src/views/admin/LoginV2.vue",
    "src/views/admin/DashboardV2.vue",
    "src/components/admin/FunctionalTransactions.vue",
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.doesNotMatch(source, /components\/(?:legacy|primevue|varlet)\//, path);
    assert.doesNotMatch(source, /#[0-9A-Fa-f]{3,8}\b/, path);
  }
});

test("admin shell follows Maia sidebar-08 composition without rejected residue", async () => {
  const layout = await read("src/layouts/AdminLayoutV2.vue");
  const appSidebar = await read("src/components/admin/AppSidebar.vue");
  const navMain = await read("src/components/admin/NavMain.vue");
  const navUser = await read("src/components/admin/NavUser.vue");
  const login = await read("src/views/admin/LoginV2.vue");
  const themeToggle = await read("src/components/admin/AdminThemeToggle.vue");
  const adminTheme = await read("src/utils/adminTheme.ts");
  const sidebarRecipe = canonical(await read("src/components/ui/sidebar/index.ts"));
  const sidebarRecipeFixture = canonical(await read("tests/fixtures/reka-maia/sidebar-index.ts"));
  const sidebarMenuButtonChild = canonical(await read("src/components/ui/sidebar/SidebarMenuButtonChild.vue"));
  const sidebarMenuButtonChildFixture = canonical(await read("tests/fixtures/reka-maia/SidebarMenuButtonChild.vue"));
  const sidebarInset = canonical(await read("src/components/ui/sidebar/SidebarInset.vue"));
  const sidebarInsetFixture = canonical(await read("tests/fixtures/reka-maia/SidebarInset.vue"));
  const sheetContent = await read("src/components/ui/sheet/SheetContent.vue");
  const sheetOverlay = await read("src/components/ui/sheet/SheetOverlay.vue");

  assert.equal(sha256(sidebarRecipeFixture), REKA_MAIA_SIDEBAR_INDEX_SHA256);
  assert.deepEqual(sidebarRecipe, sidebarRecipeFixture);
  assert.equal(sha256(sidebarMenuButtonChildFixture), REKA_MAIA_SIDEBAR_MENU_BUTTON_CHILD_SHA256);
  assert.deepEqual(sidebarMenuButtonChild, sidebarMenuButtonChildFixture);
  assert.equal(sha256(sidebarInsetFixture), REKA_MAIA_SIDEBAR_INSET_SHA256);
  assert.equal(sidebarInset, sidebarInsetFixture);
  assert.match(layout, /<SidebarProvider/);
  assert.match(layout, /<AppSidebar/);
  assert.match(layout, /<SidebarInset/);
  assert.match(layout, /<SidebarTrigger class="-ml-1 bg-background hover:bg-accent hover:text-accent-foreground"/);
  assert.match(layout, /<AdminThemeToggle/);
  assert.ok(layout.indexOf("<Breadcrumb") < layout.indexOf("<AdminThemeToggle"));
  assert.match(layout, /<Separator/);
  assert.match(layout, /<Breadcrumb/);
  assert.match(appSidebar, /logo-trans\.png/);
  assert.match(appSidebar, /data-admin-logo/);
  assert.match(appSidebar, /<NavMain/);
  assert.doesNotMatch(appSidebar, /<AdminThemeToggle/);
  assert.match(appSidebar, /data-admin-logo[^>]*class="[^"]*bg-white/);
  assert.match(login, /data-login-context[^>]*class="[^"]*bg-sidebar[^"]*text-sidebar-foreground/);
  assert.doesNotMatch(login, /data-login-context[^>]*class="[^"]*bg-foreground/);
  assert.doesNotMatch(themeToggle, /<Switch/);
  assert.match(themeToggle, /<Button/);
  assert.match(themeToggle, /Gunakan mode terang/);
  assert.match(themeToggle, /Gunakan mode gelap/);
  assert.match(adminTheme, /localStorage/);
  assert.match(adminTheme, /prefers-color-scheme: dark/);
  assert.match(appSidebar, /<NavUser/);
  assert.match(navMain, /<SidebarGroup>/);
  assert.match(navMain, /<SidebarGroupContent>/);
  assert.match(navMain, /<Collapsible[^>]*v-for="item in props\.items"/);
  assert.match(navMain, /<CollapsibleTrigger as-child>/);
  assert.match(navMain, /<SidebarMenuAction[\s\S]*?class="peer-data-\[size=default\]\/menu-button:top-2 data-\[state=open\]:rotate-90"/);
  assert.match(navMain, /<CollapsibleContent>/);
  assert.match(navMain, /<SidebarMenuSub class="pt-1"/);
  assert.match(navMain, /<SidebarMenuSub class="pt-1">/);
  assert.match(navMain, /<SidebarMenuSubButton/);
  assert.match(navUser, /<DropdownMenu/);
  assert.match(navUser, /<Avatar/);
  assert.match(navUser, /w-\(--reka-dropdown-menu-trigger-width\) min-w-56 rounded-lg/);
  assert.doesNotMatch([layout, appSidebar, navMain, navUser].join("\n"), /<details|<select|>NH/);

  assert.match(sidebarInset, /rounded-xl/);
  assert.match(sidebarInset, /shadow-sm/);
  assert.match(sheetContent, /:data-side="side"/);
  assert.match(sheetContent, /data-\[state=open\]:animate-in/);
  assert.match(sheetContent, /data-\[side=left\]:data-\[state=open\]:slide-in-from-left-10/);
  assert.match(sheetOverlay, /data-\[state=open\]:fade-in-0/);
  const shellConsumers = [layout, appSidebar, navMain, navUser].join("\n");
  assert.doesNotMatch(shellConsumers, /size-11|min-h-11/);
  assert.doesNotMatch(navMain, /border-s-2|data-\[active=true\]:border|border-secondary/);
  assert.doesNotMatch(shellConsumers, /aria-current/);
  assert.doesNotMatch(layout, /<SidebarInset[^>]*class="[^"]*(?:rounded|shadow)/);
  assert.match(layout, /const previewError = ref\(""\)/);
  assert.match(layout, /<p v-if="previewError" role="alert"/);
  assert.match(layout, /function openPreviewDialog\(\) \{\s*previewError\.value = ""\s*previewDialogOpen\.value = true\s*\}/);
});
