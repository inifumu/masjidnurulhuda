import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.R2_PUBLIC_BASE_URL || "http://127.0.0.1:4173";
const viewports = [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1366, height: 900 }];

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.route("**/api/admin/auth/me", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ status: "error", error: { code: "UNAUTHORIZED", message: "Tidak ada sesi" } }) }));
    await page.route("**/api/public/jadwal/today**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", data: { lokasi: "Surakarta", jadwal: { subuh: "04:30", dzuhur: "11:45", ashar: "15:05", maghrib: "17:38", isya: "18:48" } } }) }));
    await page.route("**/api/public/kas/summary", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", data: { total_saldo: 1250000, pemasukan_bulan_ini: 500000, pengeluaran_bulan_ini: 250000 } }) }));
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /Informasi masjid yang jernih/ }).waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${viewport.width}: overflow ${overflow}px`);
    const fonts = await page.evaluate(() => ({ family: getComputedStyle(document.body).fontFamily, links: [...document.querySelectorAll("link")].map((link) => link.href) }));
    assert.match(fonts.family, /Inter Variable/);
    assert.equal(fonts.links.some((url) => url.includes("fonts.googleapis.com")), false);
    const undersized = await page.locator("a:visible, button:visible").evaluateAll((items) => items.filter((item) => { const r = item.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((item) => ({ text: item.textContent?.trim(), width: item.getBoundingClientRect().width, height: item.getBoundingClientRect().height })));
    assert.deepEqual(undersized, [], `${viewport.width}: control di bawah 44px`);
    if (viewport.width < 1024) {
      const trigger = page.getByRole("button", { name: "Buka menu navigasi" });
      await trigger.click();
      await page.getByRole("navigation", { name: "Navigasi mobile" }).waitFor();
      assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), "Beranda");
      await page.keyboard.press("Shift+Tab");
      assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), "Portal Pengurus");
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), "Beranda");
      await page.keyboard.press("Escape");
      await page.getByRole("navigation", { name: "Navigasi mobile" }).waitFor({ state: "hidden" });
      assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
    }
    assert.deepEqual(consoleErrors, [], `${viewport.width}: console errors`);
    await context.close();
  }

  const context = await browser.newContext({ viewport: viewports[0] });
  const page = await context.newPage();
  await page.route("**/api/admin/auth/me", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ status: "error", error: { code: "UNAUTHORIZED", message: "Tidak ada sesi" } }) }));
  await page.route("**/api/public/jadwal/today**", (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await page.route("**/api/public/kas/summary", (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await page.goto(baseURL);
  await page.getByRole("heading", { name: "Jadwal belum tersedia" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Coba lagi" }).count(), 2);
  await context.close();
} finally { await browser.close(); }
console.log("R2 public browser gate passed: 360x800, 768x1024, 1366x900 + recoverable errors");
