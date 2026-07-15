import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.R3_BROWSER_BASE_URL || "http://127.0.0.1:4173";
const viewports = [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1366, height: 900 }];
const browser = await chromium.launch({ headless: true });

const assertPage = async (page, label) => {
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert.ok(dimensions.scroll <= dimensions.client + 1, `${label}: horizontal overflow`);
  const small = await page.locator("a:visible,button:visible,input:visible").evaluateAll((items) => items.filter((item) => { const r = item.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((item) => item.getAttribute("aria-label") || item.textContent?.trim()));
  assert.deepEqual(small, [], `${label}: control <44px`);
};

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

  for (const role of ["pengurus", "ketua"]) {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.route("**/api/admin/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      const body = path === "/api/admin/auth/me"
        ? { status: "success", data: { id: 1, name: "Fixture Pengurus", role } }
        : path === "/api/admin/dashboard/summary"
          ? { data: { saldoAwal: 0, totalPemasukan: 0, totalPengeluaran: 0, saldoAkhir: 0 } }
          : { data: [] };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto(`${baseURL}/admin/dashboard`);
    await page.getByRole("heading", { name: "Ringkasan" }).waitFor();
    await page.getByRole("button", { name: "Buka navigasi" }).click();
    const nav = page.getByRole("navigation", { name: "Navigasi admin mobile" });
    await nav.waitFor();
    assert.equal(await nav.getByText("Pengaturan").count(), role === "ketua" ? 1 : 0);
    await assertPage(page, `sheet ${role}`);
    const closeButton = page.getByRole("button", { name: "Tutup navigasi" });
    assert.equal(await closeButton.count(), 1);
    await page.keyboard.press("Escape");
    await nav.waitFor({ state: "hidden" });
    await assertPage(page, `shell ${role}`);
    await context.close();
  }
} finally { await browser.close(); }
console.log("R3 admin browser gate passed: login 360/768/1366 + role-aware mobile Sheet");
