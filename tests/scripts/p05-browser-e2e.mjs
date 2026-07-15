import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseURL = process.env.P05_BROWSER_BASE_URL || "http://127.0.0.1:4173";
const roles = {
  pengurus: { id: 11, name: "Pengurus Fixture", role: "pengurus" },
  ketua: { id: 12, name: "Ketua Fixture", role: "ketua" },
  bendahara: { id: 13, name: "Bendahara Fixture", role: "bendahara" },
};

const categories = [
  { id: 6, nama_kategori: "Kegiatan", jenis_arus: "pengeluaran" },
  { id: 1, nama_kategori: "Infaq Jumat", jenis_arus: "pemasukan" },
];
const sections = [{ id: 6, nama_seksi: "Seksi Dakwah" }];
const summary = { saldoAwal: 2000000, totalPemasukan: 0, totalPengeluaran: 0, saldoAkhir: 2000000 };

const makeTransaction = (status, id = 501) => ({
  id,
  tipe: "pengeluaran",
  jumlah: 250000,
  keterangan: "Fixture browser P0.5",
  tanggal: "2026-07-15",
  kategori_id: 6,
  kategori: "Kegiatan",
  seksi_id: 6,
  seksi: "Seksi Dakwah",
  status,
  created_at: "2026-07-15 08:00:00",
  approved_at: status === "approved" ? "2026-07-15 09:00:00" : null,
});

async function installFixture(page, initialRole, options = {}) {
  const state = {
    role: initialRole,
    transactions: options.transactions ? [...options.transactions] : [],
    financeFailures: options.financeFailures || 0,
    authFailures: options.authFailures || 0,
    conflictOnce: options.conflictOnce || false,
    mutationDelay: options.mutationDelay || 0,
  };

  await page.route("**/api/admin/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (status, body, headers = {}) => route.fulfill({ status, contentType: "application/json", headers, body: JSON.stringify(body) });

    if (path === "/api/admin/auth/me") {
      if (state.authFailures > 0) {
        state.authFailures -= 1;
        return json(503, { success: false, error: { code: "INTERNAL_ERROR", message: "Fixture auth unavailable", fields: {} } });
      }
      return json(200, { status: "success", data: roles[state.role] });
    }
    if (path === "/api/admin/auth/logout") return json(200, { status: "success" });
    if (path === "/api/admin/transaction/master-data") return json(200, { data: { categories, sections } });
    if (path === "/api/admin/transaction/list") {
      if (state.financeFailures > 0) {
        state.financeFailures -= 1;
        return json(503, { success: false, error: { code: "INTERNAL_ERROR", message: "Fixture finance unavailable", fields: {} } });
      }
      return json(200, { data: state.transactions });
    }
    if (path === "/api/admin/dashboard/summary") return json(200, { data: summary });
    if (path === "/api/admin/transaction/add-proposal") {
      const payload = request.postDataJSON();
      state.transactions = [makeTransaction("pending_ketua")];
      state.transactions[0] = { ...state.transactions[0], ...payload, kategori: "Kegiatan", seksi: "Seksi Dakwah" };
      return json(201, { status: "success", data: { transaction_id: 501 } });
    }
    if (path.startsWith("/api/admin/transaction/approve/")) {
      if (state.mutationDelay) await new Promise((resolve) => setTimeout(resolve, state.mutationDelay));
      if (state.conflictOnce) {
        state.conflictOnce = false;
        return json(409, { status: "error", message: "Status transaksi telah berubah.", error: { code: "TRANSACTION_STATE_CHANGED", fields: {} } });
      }
      const { action } = request.postDataJSON();
      const current = state.transactions[0];
      const nextStatus = action === "reject" ? "rejected" : current.status === "pending_ketua" ? "pending_bendahara" : "approved";
      state.transactions = [{ ...current, status: nextStatus, approved_at: nextStatus === "approved" ? "2026-07-15 09:00:00" : null }];
      return json(200, { status: "success", data: state.transactions[0] });
    }
    return json(404, { success: false, error: { code: "NOT_FOUND", message: `Fixture missing: ${path}`, fields: {} } });
  });
  return state;
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 1, `${label}: horizontal overflow ${dimensions.scrollWidth} > ${dimensions.clientWidth}`);
}

async function openFinance(page) {
  await page.goto(`${baseURL}/admin/finance`);
  await page.getByRole("heading", { name: "Financial Management" }).waitFor();
}

async function roleJourney(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const state = await installFixture(page, "pengurus");
  await openFinance(page);
  await assertNoHorizontalOverflow(page, `pengurus ${viewport.width}`);
  assert.equal(await page.getByRole("button", { name: "Kas Baru" }).count(), 0, "pengurus tidak boleh melihat Kas Baru");

  await page.getByRole("button", { name: "Proposal" }).click();
  await page.getByText("Minta Dana Keluar").click();
  await page.locator("#proposal-kategori_id").click();
  await page.getByRole("option", { name: "Kegiatan" }).click();
  await page.locator("#proposal-seksi_id").click();
  await page.getByRole("option", { name: "Seksi Dakwah" }).click();
  await page.locator("#proposal-jumlah").fill("250000");
  await page.locator("#proposal-keterangan").fill("Fixture browser P0.5");
  await page.getByRole("button", { name: "Kirim Pengajuan Proposal" }).click();
  const proposalTitle = page.getByRole("heading", { name: "Ajukan Proposal?" });
  await proposalTitle.waitFor();
  await page.keyboard.press("Escape");
  await proposalTitle.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Kirim Pengajuan Proposal" }).click();
  await page.getByRole("button", { name: "Ya, Ajukan" }).click();
  assert.equal(state.transactions[0].status, "pending_ketua");

  state.role = "ketua";
  await context.clearCookies();
  await page.reload();
  await page.getByRole("button", { name: /Approval/ }).click();
  const approveKetua = page.getByRole("button", { name: "Setujui" }).first();
  await approveKetua.click();
  await page.getByRole("heading", { name: "Setujui Proposal?" }).waitFor();
  await page.getByRole("button", { name: "Ya, Setujui" }).click();
  assert.equal(state.transactions[0].status, "pending_bendahara");

  state.role = "bendahara";
  await page.reload();
  await page.getByRole("button", { name: /Approval/ }).click();
  await page.getByRole("button", { name: "Cairkan" }).first().click();
  await page.getByRole("heading", { name: "Cairkan Dana?" }).waitFor();
  await page.getByRole("button", { name: "Ya, Cairkan" }).click();
  assert.equal(state.transactions[0].status, "approved");
  await page.getByRole("button", { name: "Laporan" }).click();
  await page.getByText("Fixture browser P0.5").filter({ visible: true }).waitFor();
  await assertNoHorizontalOverflow(page, `approved ${viewport.width}`);
  await context.close();
}

async function recoveryAndConflict(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const state = await installFixture(page, "ketua", { authFailures: 100, transactions: [makeTransaction("pending_ketua")], conflictOnce: true, mutationDelay: 350 });
  const authStatuses = [];
  page.on("response", (response) => {
    if (response.url().includes("/api/admin/auth/me")) authStatuses.push(response.status());
  });
  await page.goto(`${baseURL}/admin/finance`);
  const authAlert = page.getByRole("alert");
  try {
    await authAlert.getByText("Sesi belum dapat diverifikasi").waitFor({ timeout: 5000 });
  } catch {
    throw new Error(`Auth recovery tidak rendered: ${JSON.stringify({ url: page.url(), authStatuses, body: (await page.locator("body").innerText()).slice(0, 500) })}`);
  }
  assert.ok(!page.url().endsWith("/admin/login"), "5xx auth tidak boleh redirect ke login");
  state.authFailures = 0;
  await authAlert.getByRole("button", { name: "Coba lagi" }).click();
  await page.getByRole("heading", { name: "Financial Management" }).waitFor();

  state.financeFailures = 1;
  await page.reload();
  const financeAlert = page.getByRole("alert");
  await financeAlert.getByText("Data keuangan belum dapat dimuat.").waitFor();
  await financeAlert.getByRole("button", { name: "Coba lagi" }).click();
  await page.getByRole("button", { name: /Approval/ }).click();
  await page.getByRole("button", { name: "Setujui" }).first().click();
  const dialogTitle = page.getByRole("heading", { name: "Setujui Proposal?" });
  await dialogTitle.waitFor();
  const confirm = page.getByRole("button", { name: "Ya, Setujui" });
  await confirm.click();
  await page.getByRole("button", { name: "Memproses..." }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Memproses..." }).isDisabled(), true, "confirm pending harus disabled");
  await page.keyboard.press("Escape");
  assert.equal(await dialogTitle.isVisible(), true, "Escape tidak menutup dialog saat pending");
  await page.getByRole("button", { name: "Ya, Setujui" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Ya, Setujui" }).isDisabled(), false, "confirm aktif kembali setelah conflict");
  assert.equal(state.transactions[0].status, "pending_ketua", "conflict tidak boleh memutasi fixture");
  try {
    await page.getByText("Status transaksi telah berubah.").waitFor({ timeout: 3000 });
  } catch {
    const liveText = await page.locator('[aria-live], [data-sonner-toaster]').allInnerTexts();
    throw new Error(`Pesan conflict tidak tampil: ${JSON.stringify(liveText)}`);
  }
  await page.keyboard.press("Escape");
  await dialogTitle.waitFor({ state: "hidden" });
  await assertNoHorizontalOverflow(page, `recovery ${viewport.width}`);
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 360, height: 800 }, { width: 1366, height: 900 }]) {
    await roleJourney(browser, viewport);
  }
  await recoveryAndConflict(browser, { width: 360, height: 800 });
  await recoveryAndConflict(browser, { width: 1366, height: 900 });
  console.log(JSON.stringify({ browser: "chromium", viewports: ["360x800", "1366x900"], roleJourney: "pass", recovery: "pass", conflict: "pass", focusEscapePending: "pass", overflow: "pass" }));
} finally {
  await browser.close();
}
