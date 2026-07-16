import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.R3_BROWSER_BASE_URL || "http://127.0.0.1:4173";
const viewports = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 1366, height: 900 }];
const roles = ["superadmin", "ketua", "bendahara", "pengurus"];
const browser = await chromium.launch({ headless: true });

const assertOverflow = async (page, label) => {
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert.ok(dimensions.scroll <= dimensions.client + 1, `${label}: horizontal overflow`);
};
const assertControls = async (page, minimum, label) => {
  const small = await page.locator("a:visible,button:visible,input:visible").evaluateAll((items, min) => items.filter((item) => {
    const r = item.getBoundingClientRect(); return r.width < min || r.height < min;
  }).map((item) => ({ name: item.getAttribute("aria-label") || item.textContent?.trim(), width: item.getBoundingClientRect().width, height: item.getBoundingClientRect().height })), minimum);
  assert.deepEqual(small, [], `${label}: control <${minimum}px`);
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
    await assertOverflow(page, `login ${viewport.width}`);
    await assertControls(page, 44, `login ${viewport.width}`);
    assert.deepEqual(errors.filter((message) => !message.includes("401 (Unauthorized)")), []);
    await context.close();
  }

  for (const role of roles) for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await mockAdmin(page, role);
    await page.goto(`${baseURL}/admin/dashboard`);
    await page.locator('[data-slot="sidebar-wrapper"]').waitFor();
    const contentScroll = page.locator('[data-slot="admin-content-scroll"]');
    await contentScroll.locator(':scope > div').evaluate((node) => { node.style.height = '2000px'; node.style.flexShrink = '0'; });
    await contentScroll.evaluate((node) => { node.scrollTop = 300; });
    assert.ok(await contentScroll.evaluate((node) => node.scrollTop) > 0, `content pane normal tidak benar-benar scroll pada ${viewport.width}`);
    assert.equal(await page.locator('[data-slot="sidebar-inset"] > header').evaluate((node) => node.getBoundingClientRect().top), 0, `header normal tidak sticky pada ${viewport.width}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollTop), 0, `document ikut scroll pada ${viewport.width}`);
    const expectedSettings = role === "superadmin" || role === "ketua";
    const trigger = page.locator('[data-slot="sidebar-trigger"]');

    if (viewport.width < 768) {
      await trigger.click();
      const sheet = page.locator('[data-mobile="true"]');
      await sheet.waitFor();
      await page.waitForTimeout(220);
      assert.equal(await sheet.getAttribute("id"), "admin-sidebar-navigation");
      assert.equal(await sheet.getAttribute("role"), "navigation");
      assert.equal(await sheet.getAttribute("aria-label"), "Navigasi admin");
      assert.equal(await trigger.getAttribute("aria-controls"), "admin-sidebar-navigation");
      assert.equal(await sheet.getByText("Pengaturan", { exact: true }).count(), expectedSettings ? 1 : 0);
      const close = page.getByRole("button", { name: "Tutup navigasi" });
      assert.deepEqual(await close.evaluate((node) => { const r = node.getBoundingClientRect(); return [r.width, r.height]; }), [44, 44]);
      const mobileIconGeometry = await page.evaluate(() => {
        const closeIcon = document.querySelector('[data-slot="sheet-close"] svg').getBoundingClientRect();
        const accountIcon = document.querySelector('[data-account-trigger] > svg').getBoundingClientRect();
        const submenuIcon = document.querySelector('[data-slot="collapsible-trigger"] > svg:last-child').getBoundingClientRect();
        const triggerIcon = document.querySelector('[data-slot="sidebar-trigger"] svg');
        return {
          sizes: [closeIcon.width, accountIcon.width, submenuIcon.width],
          centers: [closeIcon.x + closeIcon.width / 2, accountIcon.x + accountIcon.width / 2, submenuIcon.x + submenuIcon.width / 2],
          closeCenterY: closeIcon.y + closeIcon.height / 2,
          triggerClass: triggerIcon?.getAttribute("class") ?? "",
        };
      });
      assert.deepEqual(mobileIconGeometry.sizes, [20, 20, 20]);
      assert.ok(Math.max(...mobileIconGeometry.centers) - Math.min(...mobileIconGeometry.centers) <= 1, `${role}: mobile trailing icons tidak sejajar ${JSON.stringify(mobileIconGeometry.centers)}`);
      assert.equal(mobileIconGeometry.closeCenterY, 32, `${role}: ikon close tidak center pada header 64px`);
      assert.ok(!mobileIconGeometry.triggerClass.includes("cn-rtl-flip"), `${role}: mobile trigger masih memakai panel icon`);
      await assertControls(page, 44, `mobile shell ${role}`);
      await page.keyboard.press("Escape");
      await sheet.waitFor({ state: "hidden" });
      assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
      await trigger.click();
      await sheet.waitFor();
      const account = page.locator("[data-account-trigger]");
      assert.deepEqual(await account.evaluate((node) => { const r = node.getBoundingClientRect(); return [r.width, r.height]; }), [44, 44]);
      await account.click();
      const popup = page.locator('[data-slot="dropdown-menu-content"]');
      await popup.waitFor();
      await page.waitForFunction(({ width, height }) => [...document.querySelectorAll('[data-slot="dropdown-menu-content"]')].some((node) => {
        const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.x >= -1 && r.right <= width + 1 && r.y >= -1 && r.bottom <= height + 1;
      }), viewport);
      const popupBox = await popup.evaluate((node) => { const r = node.getBoundingClientRect(); return { x: r.x, right: r.right, y: r.y, bottom: r.bottom, radius: getComputedStyle(node).borderRadius }; });
      assert.ok(popupBox.x >= -1 && popupBox.right <= viewport.width + 1 && popupBox.y >= -1 && popupBox.bottom <= viewport.height + 1, `${role} ${viewport.width}: popup ${JSON.stringify(popupBox)}`);
      assert.equal(popupBox.radius, "10px");
      assert.equal(await popup.getByRole("menuitem").first().evaluate((node) => node.getBoundingClientRect().height), 44);
      assert.ok(Math.abs(popupBox.right - await account.evaluate((node) => node.getBoundingClientRect().right)) <= 1, `${role} ${viewport.width}: popup akun tidak menempel ke trigger titik tiga`);
      await page.keyboard.press("Escape");
      await popup.waitFor({ state: "hidden" });
      assert.equal(await account.evaluate((node) => node === document.activeElement), true);
      await page.getByRole("button", { name: "Tutup navigasi" }).click();
      await sheet.waitFor({ state: "hidden" });
      assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
    } else {
      const sidebar = page.locator('[data-sidebar="sidebar"]');
      assert.equal(await page.locator('#admin-sidebar-navigation [role="navigation"]').count(), 1);
      assert.equal(Math.round(await sidebar.evaluate((node) => node.getBoundingClientRect().width)), 239);
      assert.equal(await page.getByText("Pengaturan", { exact: true }).count() > 0, expectedSettings);
      const spacing = await page.evaluate(() => {
        const button = document.querySelector('[data-slot="sidebar-trigger"]');
        const glyph = button.querySelector("svg").getBoundingClientRect();
        const separator = document.querySelector('header span[aria-hidden="true"]').getBoundingClientRect();
        const breadcrumb = document.querySelector('header span[aria-hidden="true"]').nextElementSibling.getBoundingClientRect();
        const theme = document.querySelector('[data-theme-trigger]').getBoundingClientRect();
        return { before: separator.left - glyph.right, after: breadcrumb.left - separator.right, right: innerWidth - theme.right };
      });
      assert.deepEqual(spacing, { before: 16, after: 16, right: 16 });
      const shellIconSizes = await page.locator('[data-slot="sidebar-trigger"] svg, [data-theme-trigger] svg').evaluateAll((icons) => icons.map((icon) => icon.getBoundingClientRect().width));
      assert.deepEqual(shellIconSizes, [20, 20]);
      await assertControls(page, 32, `desktop shell ${role} ${viewport.width}`);
      const account = page.locator('[data-account-trigger]');
      assert.deepEqual(await account.evaluate((node) => { const r = node.getBoundingClientRect(); return [r.width, r.height]; }), [32, 32]);
      await account.click();
      const accountPopup = page.locator('[data-slot="dropdown-menu-content"]');
      await accountPopup.waitFor();
      await accountPopup.waitFor({ state: "visible" });
      assert.equal(await accountPopup.getByRole("menuitem").first().evaluate((node) => parseFloat(getComputedStyle(node).height)), 32);
      await page.keyboard.press("Escape");
      await accountPopup.waitFor({ state: "hidden" });
      assert.equal(await account.evaluate((node) => node === document.activeElement), true);
      await trigger.click();
      await page.waitForTimeout(220);
      assert.equal(Math.round(await sidebar.evaluate((node) => node.getBoundingClientRect().width)), 47);
      const finance = page.locator('[data-slot="collapsible-trigger"]').filter({ hasText: "Keuangan" });
      await finance.click();
      await page.waitForTimeout(220);
      assert.equal(Math.round(await sidebar.evaluate((node) => node.getBoundingClientRect().width)), 239);
      assert.equal(await finance.getAttribute("data-state"), "open");
      assert.equal(await page.getByText("Keuangan", { exact: true }).count() >= 2, true);
    }

    const theme = page.locator("[data-theme-trigger]");
    const themeStyle = await theme.evaluate((node) => { const style = getComputedStyle(node); return { radius: style.borderRadius, transition: parseFloat(style.transitionDuration) }; });
    assert.equal(themeStyle.radius, "10px");
    assert.ok(themeStyle.transition <= 0.001, "theme button harus menghormati reduced motion");
    const pressed = await theme.getAttribute("aria-pressed");
    await theme.click();
    assert.notEqual(await theme.getAttribute("aria-pressed"), pressed);

    await assertOverflow(page, `shell ${role} ${viewport.width}`);
    assert.match(await page.evaluate(() => getComputedStyle(document.body).fontFamily), /Inter Variable/);
    assert.deepEqual(errors, [], `${role} ${viewport.width}: console errors`);
    await context.close();
  }
  for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1366, height: 900 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    let session = { id: 7, name: "Fixture Superadmin", role: "superadmin" };
    await page.route("**/api/admin/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/api/admin/auth/me") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", data: session }) });
      if (path === "/api/admin/auth/impersonation/start") {
        const role = JSON.parse(route.request().postData() ?? "{}").role;
        session = { id: 7, name: "Fixture Superadmin", role, impersonation: { active: true, role, original_role: "superadmin", actor_id: 7, actor_name: "Fixture Superadmin", expires_at: Math.floor(Date.now() / 1000) + 900 } };
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", data: { role } }) });
      }
      if (path === "/api/admin/auth/impersonation/stop") {
        session = { id: 7, name: "Fixture Superadmin", role: "superadmin" };
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "success", data: { role: "superadmin" } }) });
      }
      const body = path === "/api/admin/dashboard/summary" ? { data: { saldoAwal: 0, totalPemasukan: 0, totalPengeluaran: 0, saldoAkhir: 0 } } : { data: [] };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    await page.goto(`${baseURL}/admin/dashboard`);
    if (viewport.width < 768) await page.locator('[data-slot="sidebar-trigger"]').click();
    await page.locator("[data-account-trigger]").click();
    await page.getByRole("menuitem", { name: "Role Pengurus" }).click();
    const banner = page.locator("[data-impersonation-banner]:visible");
    await banner.waitFor();
    assert.match(await banner.innerText(), /Mode samaran: Pengurus/);
    assert.match(await banner.innerText(), /Fixture Superadmin/);
    const contentScroll = page.locator('[data-slot="admin-content-scroll"]');
    await contentScroll.locator(':scope > div').evaluate((node) => { node.style.height = '2000px'; node.style.flexShrink = '0'; });
    await contentScroll.evaluate((node) => { node.scrollTop = 300; });
    assert.ok(await contentScroll.evaluate((node) => node.scrollTop) > 0, `content pane samaran tidak benar-benar scroll pada ${viewport.width}`);
    if (viewport.width >= 768) {
      const globalGeometry = await page.evaluate(() => {
        const banner = document.querySelector('[data-impersonation-banner-global]').getBoundingClientRect();
        const sidebar = document.querySelector('[data-sidebar="sidebar"]').getBoundingClientRect();
        const inset = document.querySelector('[data-slot="sidebar-inset"]').getBoundingClientRect();
        return { bannerTop: banner.top, bannerBottom: banner.bottom, sidebarTop: sidebar.top, insetTop: inset.top };
      });
      assert.deepEqual(globalGeometry, { bannerTop: 0, bannerBottom: 48, sidebarTop: 48, insetTop: 48 });
      assert.equal(await banner.evaluate((node) => node.getBoundingClientRect().top), 0, "banner samaran harus tetap sticky saat workspace di-scroll");
      assert.equal(await page.locator('[data-slot="sidebar-inset"] > header').evaluate((node) => node.getBoundingClientRect().top), 48, "header samaran desktop harus tetap tepat di bawah banner");
    } else {
      assert.equal(await page.locator('[data-slot="sidebar-inset"] > header').evaluate((node) => node.getBoundingClientRect().top), 48, "header samaran mobile harus tetap tepat di bawah banner");
    }
    assert.equal(await page.getByText("Pengaturan", { exact: true }).count(), 0);
    await banner.getByRole("button", { name: "Keluar samaran" }).click();
    await banner.waitFor({ state: "hidden" });
    assert.equal(session.role, "superadmin");
    await context.close();
  }
} finally { await browser.close(); }
console.log("R3 admin browser gate passed: shell 4 roles x 5 viewports + impersonation mobile/desktop");
