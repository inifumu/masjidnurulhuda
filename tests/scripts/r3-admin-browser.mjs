import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.R3_BROWSER_BASE_URL || "http://127.0.0.1:4173";
const viewports = [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1366, height: 900 }];
const roles = ["superadmin", "ketua", "bendahara", "pengurus"];
const browser = await chromium.launch({ headless: true });

const assertPage = async (page, label) => {
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert.ok(dimensions.scroll <= dimensions.client + 1, `${label}: horizontal overflow`);
  const small = await page.locator("a:visible,button:visible,input:visible").evaluateAll((items) => items.filter((item) => { const r = item.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((item) => item.getAttribute("aria-label") || item.textContent?.trim()));
  assert.deepEqual(small, [], `${label}: control <44px`);
};

const mockAdmin = async (page, role) => page.route("**/api/admin/**", (route) => {
  const path = new URL(route.request().url()).pathname;
  const body = path === "/api/admin/auth/me"
    ? { status: "success", data: { id: 1, name: `Fixture ${role}`, role } }
    : path === "/api/admin/dashboard/summary"
      ? { data: { saldoAwal: 0, totalPemasukan: 0, totalPengeluaran: 0, saldoAkhir: 0 } }
      : { data: [] };
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
});

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.route("**/api/admin/auth/me", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ status: "error", error: { code: "UNAUTHORIZED" } }) }));
    await page.goto(`${baseURL}/admin/login`);
    await page.getByRole("heading", { name: "Masuk ke ruang admin" }).waitFor();
    assert.equal(await page.locator("#login-email").evaluate((node) => node === document.activeElement), true);
    await assertPage(page, `login ${viewport.width}`);
    assert.deepEqual(errors.filter((message) => !message.includes("401 (Unauthorized)")), []);
    await context.close();
  }

  for (const role of roles) {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors = [];
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      await mockAdmin(page, role);
      await page.goto(`${baseURL}/admin/dashboard`);
      await page.getByRole("heading", { name: "Ringkasan" }).waitFor();
      const expectedSettings = role === "superadmin" || role === "ketua";
      const navName = viewport.width < 768 ? "Navigasi admin mobile" : "Navigasi admin";
      if (viewport.width < 768) {
        const trigger = page.getByRole("button", { name: "Buka navigasi" });
        assert.ok([null, "false"].includes(await trigger.getAttribute("aria-expanded")));
        await trigger.click();
        const nav = page.getByRole("navigation", { name: navName });
        await nav.waitFor();
        await page.locator('[data-slot="sheet-content"]').waitFor();
        await page.waitForTimeout(250);
        assert.equal(await page.locator('[data-slot="sheet-content"]').getAttribute("data-state"), "open");
        assert.equal(await nav.getByText("Pengaturan").count(), expectedSettings ? 1 : 0);
        const close = page.getByRole("button", { name: "Tutup navigasi" });
        const closeIcon = await close.locator("svg").evaluate((node) => { const r = node.getBoundingClientRect(); return [r.width, r.height]; });
        assert.deepEqual(closeIcon, [24, 24], `${role} ${viewport.width}: close icon harus 24px`);
        await assertPage(page, `sheet ${role} ${viewport.width}`);
        await page.keyboard.press("Escape");
        await nav.waitFor({ state: "hidden" });
        assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
      } else {
        const nav = page.getByRole("navigation", { name: navName });
        assert.equal(await nav.getByText("Pengaturan").count(), expectedSettings ? 1 : 0);
        const sidebarWidth = await page.locator("aside").evaluate((node) => node.getBoundingClientRect().width);
        assert.equal(sidebarWidth, 240);
      }
      const theme = page.locator("[data-theme-trigger]");
      const pressed = await theme.getAttribute("aria-pressed");
      await theme.click();
      assert.notEqual(await theme.getAttribute("aria-pressed"), pressed);
      const account = page.locator("[data-account-trigger]");
      await account.click();
      assert.equal(await account.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => document.activeElement?.matches("[data-account-trigger]"));
      assert.equal(await account.evaluate((node) => node === document.activeElement), true);
      await assertPage(page, `shell ${role} ${viewport.width}`);
      assert.deepEqual(errors, [], `${role} ${viewport.width}: console errors`);
      await context.close();
    }
  }
} finally { await browser.close(); }
console.log("R3 admin browser gate passed: login + 4 role x 3 viewport + Sheet/account/theme/navigation interactions");
