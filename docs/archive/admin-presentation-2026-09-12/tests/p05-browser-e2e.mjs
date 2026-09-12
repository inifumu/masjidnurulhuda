import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.P05_BROWSER_BASE_URL || "http://127.0.0.1:4173";
const evidenceDir = process.env.P05_BROWSER_EVIDENCE_DIR;
if (evidenceDir) await mkdir(evidenceDir, { recursive: true });
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
const currentWibDate = new Intl.DateTimeFormat("fr-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

const makeTransaction = (status, id = 501) => ({
  id,
  tipe: "pengeluaran",
  jumlah: 250000,
  keperluan: "Konsumsi rapat pengurus",
  keterangan: "Fixture browser P0.5",
  tanggal: currentWibDate,
  kategori_id: 6,
  kategori: "Kegiatan",
  seksi_id: 6,
  seksi: "Seksi Dakwah",
  status,
  created_at: "2026-07-15 08:00:00",
  approved_at: status === "approved" ? "2026-07-15 09:00:00" : null,
});

const filterTransactions = (transactions, url) => {
  const month = Number(url.searchParams.get("month"));
  const year = Number(url.searchParams.get("year"));
  const flow = url.searchParams.get("tipe");
  const category = Number(url.searchParams.get("kategori_id"));
  return transactions.filter((transaction) => {
    const [transactionYear, transactionMonth] = transaction.tanggal.split("-").map(Number);
    return (!month || transactionMonth === month)
      && (!year || transactionYear === year)
      && (!flow || transaction.tipe === flow)
      && (!category || transaction.kategori_id === category);
  });
};

async function installFixture(page, initialRole, options = {}) {
  const state = options.state ?? {
    role: initialRole,
    transactions: options.transactions ? [...options.transactions] : [],
    financeFailures: options.financeFailures || 0,
    authFailures: options.authFailures || 0,
    conflictOnce: options.conflictOnce || false,
    mutationDelay: options.mutationDelay || 0,
    transactionRequests: [],
    directRequests: [],
    directFailures: [...(options.directFailures || [])],
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
      state.transactionRequests.push(url.search);
      if (state.financeFailures > 0) {
        state.financeFailures -= 1;
        return json(503, { success: false, error: { code: "INTERNAL_ERROR", message: "Fixture finance unavailable", fields: {} } });
      }
      return json(200, { data: filterTransactions(state.transactions, url) });
    }
    if (path === "/api/admin/dashboard/summary") return json(200, { data: summary });
    if (path === "/api/admin/transaction/add-proposal") {
      const payload = request.postDataJSON();
      state.transactions = [makeTransaction("pending_ketua")];
      state.transactions[0] = { ...state.transactions[0], ...payload, kategori: "Kegiatan", seksi: "Seksi Dakwah" };
      return json(201, { status: "success", data: { transaction_id: 501 } });
    }
    if (path === "/api/admin/transaction/add-direct") {
      const payload = request.postDataJSON();
      state.directRequests.push({ payload, key: request.headers()["idempotency-key"] });
      if (state.mutationDelay) await new Promise((resolve) => setTimeout(resolve, state.mutationDelay));
      const failure = state.directFailures.shift();
      if (failure) return json(failure, { status: "error", message: failure === 409 ? "Payload idempotensi berbeda." : "Layanan kas sementara tidak tersedia.", error: { code: failure === 409 ? "IDEMPOTENCY_CONFLICT" : "INTERNAL_ERROR", fields: {} } });
      const created = { ...makeTransaction("approved", 700 + state.directRequests.length), ...payload, kategori: payload.tipe === "pemasukan" ? "Infaq Jumat" : "Kegiatan", seksi: null };
      state.transactions = [created, ...state.transactions];
      return json(201, { status: "success", data: { transaction_id: created.id } });
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
    if (/\/api\/admin\/transaction\/\d+\/timeline$/.test(path)) {
      const id = Number(path.split("/").at(-2));
      const transaction = state.transactions.find((item) => item.id === id);
      const events = transaction?.created_at ? [{ id: 1, event_type: "created", from_status: null, to_status: transaction.status, actor_id: roles[state.role].id, actor_name: roles[state.role].name, reason: transaction.void_reason || null, created_at: transaction.created_at }] : [];
      return json(200, { data: { events, history_available: events.length > 0 } });
    }
    if (/\/api\/admin\/transaction\/\d+\/void$/.test(path)) {
      const { reason } = request.postDataJSON();
      state.transactions = [{ ...state.transactions[0], status: "void", void_reason: reason }];
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
  await page.waitForURL(/\/admin\/finance\/transaksi$/);
  await page.getByRole("heading", { name: "Transaksi", exact: true }).waitFor();
}

async function roleJourney(browser, viewport) {
  const context = await browser.newContext({ viewport });
  let page = await context.newPage();
  const state = await installFixture(page, "pengurus");
  await openFinance(page);
  await assertNoHorizontalOverflow(page, `pengurus ${viewport.width}`);
  assert.equal(await page.getByRole("link", { name: /Persetujuan/ }).count(), 0, "pengurus tidak boleh melihat Persetujuan");

  await page.getByLabel("Workflow keuangan").getByRole("link", { name: "Proposal", exact: true }).click();
  await page.getByRole("radio", { name: "Minta Dana", exact: true }).check();
  const proposalForm = page.locator("[data-proposal-request-brief] form");
  await proposalForm.getByRole("button", { name: /Kategori/ }).click();
  await page.getByRole("menuitemradio", { name: "Kegiatan", exact: true }).click();
  await proposalForm.getByRole("button", { name: /Seksi pengaju/ }).click();
  await page.getByRole("menuitemradio", { name: "Seksi Dakwah", exact: true }).click();
  await proposalForm.locator('input[inputmode="numeric"]').fill("250000");
  await proposalForm.getByPlaceholder("Contoh: Konsumsi rapat pengurus").fill("Konsumsi rapat pengurus");
  await proposalForm.locator("textarea").fill("Fixture browser P0.5");
  await page.getByRole("button", { name: "Review pengajuan", exact: true }).click();
  const proposalTitle = page.getByRole("heading", { name: "Ajukan Proposal?" });
  await proposalTitle.waitFor();
  await page.keyboard.press("Escape");
  await proposalTitle.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Review pengajuan", exact: true }).click();
  await page.getByRole("button", { name: "Ya, Ajukan" }).click();
  assert.equal(state.transactions[0].status, "pending_ketua");

  await context.close();

  state.role = "ketua";
  const ketuaContext = await browser.newContext({ viewport });
  const ketuaPage = await ketuaContext.newPage();
  await installFixture(ketuaPage, "ketua", { state });
  await ketuaPage.goto(`${baseURL}/admin/finance/persetujuan`);
  await ketuaPage.getByRole("heading", { name: "Persetujuan", exact: true }).waitFor();
  const approveKetua = ketuaPage.getByRole("button", { name: "Setujui" }).first();
  await approveKetua.click();
  await ketuaPage.getByRole("heading", { name: "Setujui Proposal?" }).waitFor();
  await ketuaPage.getByRole("button", { name: "Ya, Setujui" }).click();
  assert.equal(state.transactions[0].status, "pending_bendahara");
  await ketuaContext.close();

  state.role = "bendahara";
  const bendaharaContext = await browser.newContext({ viewport });
  const bendaharaPage = await bendaharaContext.newPage();
  await installFixture(bendaharaPage, "bendahara", { state });
  await bendaharaPage.goto(`${baseURL}/admin/finance/persetujuan`);
  await bendaharaPage.getByRole("heading", { name: "Persetujuan", exact: true }).waitFor();
  await bendaharaPage.getByRole("button", { name: "Cairkan" }).first().click();
  await bendaharaPage.getByRole("heading", { name: "Cairkan Dana?" }).waitFor();
  await bendaharaPage.getByRole("button", { name: "Ya, Cairkan" }).click();
  assert.equal(state.transactions[0].status, "approved");
  page = bendaharaPage;
  await page.goto(`${baseURL}/admin/finance/transaksi`);
  await page.getByRole("heading", { name: "Transaksi", exact: true }).waitFor();
  const transactionRow = page.getByRole("button", { name: /Konsumsi rapat pengurus/ });
  await transactionRow.waitFor();
  await transactionRow.click();
  const detailTitle = page.getByRole("heading", { name: "Konsumsi rapat pengurus" });
  if (viewport.width < 1280) {
    await detailTitle.waitFor();
    const detailDialog = page.getByRole("dialog", { name: "Konsumsi rapat pengurus" });
    await detailDialog.waitFor();
    assert.equal(await detailDialog.getAttribute("aria-modal"), "true", "detail Sheet harus mengekspos semantik modal untuk assistive technology");
    assert.equal(await page.locator('[data-slot="sheet-overlay"][data-state="open"]').count(), 1, "detail modal harus memiliki tepat satu overlay aktif");
    assert.equal(await detailDialog.evaluate((node) => node.contains(document.activeElement)), true, "fokus awal harus berada di dalam detail overlay");
    await page.keyboard.press("Shift+Tab");
    assert.equal(await detailDialog.evaluate((node) => node.contains(document.activeElement)), true, "Shift+Tab harus tetap dalam detail overlay");
    await detailDialog.focus();
    await page.keyboard.press("Tab");
    assert.equal(await detailDialog.evaluate((node) => node.contains(document.activeElement)), true, "Tab harus tetap dalam detail overlay");
    await page.keyboard.press("Escape");
    await detailTitle.waitFor({ state: "hidden" });
    assert.equal(await transactionRow.evaluate((node) => node === document.activeElement), true, "fokus harus kembali ke row");
    await transactionRow.click();
  } else {
    await page.getByText("Konsumsi rapat pengurus", { exact: true }).last().waitFor();
  }
  await page.getByRole("button", { name: "Batalkan transaksi" }).click();
  const voidTitle = page.getByRole("heading", { name: "Batalkan transaksi?" });
  await voidTitle.waitFor();
  const reason = "Fixture pembatalan transaksi P0.5";
  await page.locator("#audit-reason").fill(reason);
  await page.getByRole("button", { name: "Batalkan transaksi" }).last().click();
  assert.equal(state.transactions[0].status, "void");
  assert.equal(state.transactions[0].void_reason, reason);
  await assertNoHorizontalOverflow(page, `approved ${viewport.width}`);
  await bendaharaContext.close();
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
  await page.waitForURL(/\/admin\/finance\/transaksi$/);
  await page.getByRole("heading", { name: "Transaksi", exact: true }).waitFor();

  state.financeFailures = 1;
  await page.reload();
  const financeAlert = page.getByRole("alert");
  await financeAlert.getByText("Transaksi belum dapat dimuat").waitFor();
  await financeAlert.getByRole("button", { name: "Coba lagi" }).click();
  await page.goto(`${baseURL}/admin/finance/persetujuan`);
  await page.getByRole("heading", { name: "Persetujuan", exact: true }).waitFor();
  await page.getByRole("button", { name: "Setujui" }).first().click();
  const dialogTitle = page.getByRole("heading", { name: "Setujui Proposal?" });
  await dialogTitle.waitFor();
  const confirm = page.getByRole("button", { name: "Ya, Setujui" });
  await confirm.click();
  const pendingConfirm = page.getByRole("button", { name: "Memproses..." });
  await pendingConfirm.waitFor();
  assert.equal(await pendingConfirm.isDisabled(), true, "konfirmasi harus disabled selama mutation pending");
  await page.keyboard.press("Escape");
  assert.equal(await dialogTitle.isVisible(), true, "Escape tidak boleh menutup dialog selama mutation pending");
  assert.equal(state.transactions[0].status, "pending_ketua", "conflict tidak boleh memutasi fixture");
  try {
    await page.getByText("Status transaksi telah berubah.").waitFor({ timeout: 3000 });
  } catch {
    const liveText = await page.locator('[aria-live], [data-sonner-toaster]').allInnerTexts();
    throw new Error(`Pesan conflict tidak tampil: ${JSON.stringify(liveText)}`);
  }
  assert.equal(await dialogTitle.isVisible(), true, "dialog conflict tetap terbuka setelah pending selesai");
  await page.keyboard.press("Escape");
  await dialogTitle.waitFor({ state: "hidden" });
  await assertNoHorizontalOverflow(page, `recovery ${viewport.width}`);
  await context.close();
}

async function directCashDeskJourney(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const state = await installFixture(page, "bendahara", { mutationDelay: 350, directFailures: [409, 503] });
  await page.goto(`${baseURL}/admin/finance/transaksi-langsung`);
  await page.getByRole("heading", { name: "Catat kas", exact: true }).waitFor();

  const form = page.locator("form");
  await form.waitFor();
  const primaryFieldGaps = await form.evaluate(() => ["Keperluan", "Tanggal transaksi", "Kategori"].map((name) => {
    const label = [...document.querySelectorAll("label")].find((node) => node.textContent?.includes(name));
    const control = label?.htmlFor ? document.getElementById(label.htmlFor) : null;
    if (!label || !control) return { name, gap: -1 };
    return { name, gap: Math.round((control.getBoundingClientRect().top - label.getBoundingClientRect().bottom) * 10) / 10 };
  }));
  const expectedGap = viewport.width >= 1280 ? 10 : 12;
  assert.ok(primaryFieldGaps.every(({ gap }) => gap >= expectedGap - 1 && gap <= expectedGap + 1), `label-control gap harus ${expectedGap}px: ${JSON.stringify(primaryFieldGaps)}`);
  if (evidenceDir) await page.screenshot({ path: `${evidenceDir}/catat-kas-${viewport.width}-closed.png`, fullPage: true });
  const flow = form.getByRole("radiogroup", { name: "Arus transaksi" });
  await flow.waitFor();
  assert.equal(await flow.getByRole("radio").count(), 2, "arus harus memakai dua semantic radio");
  const flowGeometry = await flow.evaluate((node) => {
    const flowBox = node.getBoundingClientRect();
    const cardBox = node.closest("[data-entry-spine]")?.getBoundingClientRect();
    return { flowRight: flowBox.right, cardRight: cardBox?.right ?? 0 };
  });
  assert.ok(flowGeometry.flowRight <= flowGeometry.cardRight + 1, `pilihan arus ${viewport.width} keluar dari Entry Spine: ${JSON.stringify(flowGeometry)}`);
  await flow.getByRole("radio", { name: "Pemasukan" }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await flow.getByRole("radio", { name: "Pengeluaran" }).isChecked(), true, "keyboard ArrowRight harus memindahkan pilihan arus");

  const reviewButton = page.getByRole("button", { name: "Tinjau & simpan", exact: true });
  await reviewButton.click();
  const amount = form.getByRole("textbox", { name: /Nominal/ });
  await page.waitForFunction(() => document.activeElement?.getAttribute("inputmode") === "numeric");
  assert.equal(await amount.evaluate((node) => node === document.activeElement), true, "validasi harus fokus ke nominal sebagai field error pertama sesuai reading order");
  const category = form.getByRole("button", { name: /Kategori/ });
  await category.click();
  await page.waitForTimeout(300);
  if (evidenceDir) await page.screenshot({ path: `${evidenceDir}/catat-kas-${viewport.width}-category.png`, fullPage: true });
  await page.getByRole("menuitemradio", { name: "Kegiatan" }).click();
  await form.getByRole("textbox", { name: /Nominal/ }).fill("2500000");
  await form.getByLabel("Keperluan").fill("Pembelian perlengkapan kebersihan masjid");
  await form.getByLabel("Keterangan tambahan").fill("Sapu, pel, cairan pembersih, dan kantong sampah untuk operasional bulanan.");

  assert.equal(await page.locator("[data-live-cash-slip]").count(), 0, "review page tidak boleh kembali menjadi persistent dossier");
  await page.locator("[data-entry-closure]").getByText("Pembelian perlengkapan kebersihan masjid", { exact: false }).waitFor();

  const submit = reviewButton;
  await submit.click();
  const dialog = page.getByRole("dialog", { name: "Simpan transaksi kas?" });
  await dialog.waitFor();
  await page.waitForTimeout(300);
  assert.equal(await page.getByText("Periksa kembali kolom yang ditandai.", { exact: true }).count(), 0, "toast validasi lama harus hilang sebelum review final");
  if (evidenceDir) await page.screenshot({ path: `${evidenceDir}/catat-kas-${viewport.width}-dialog.png`, fullPage: true });
  await dialog.getByText("Slip pencatatan", { exact: true }).waitFor();
  await dialog.getByText("Pembelian perlengkapan kebersihan masjid", { exact: true }).waitFor();
  await dialog.getByText(/Rp\s*2\.500\.000/, { exact: true }).waitFor();
  const dialogBody = dialog.locator(".overflow-y-auto");
  await dialogBody.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  const consequence = dialog.getByText(/Setelah disimpan, transaksi langsung disetujui/);
  await consequence.waitFor();
  assert.equal(await consequence.isVisible(), true, "catatan konsekuensi harus dapat dibaca penuh sebelum mutation final");
  const cancel = dialog.getByRole("button", { name: "Batal" });
  await cancel.click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await submit.evaluate((node) => node === document.activeElement), true, "Cancel idle harus mengembalikan fokus ke trigger visible");
  await submit.click();
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await submit.evaluate((node) => node === document.activeElement), true, "Escape idle harus mengembalikan fokus");
  await submit.click();
  await dialog.waitFor();
  const overlay = page.locator('[data-slot="dialog-overlay"][data-state="open"]');
  await overlay.click({ position: { x: 4, y: 4 } });
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await submit.evaluate((node) => node === document.activeElement), true, "outside idle harus mengembalikan fokus");
  await submit.click();
  await dialog.waitFor();
  const confirm = dialog.getByRole("button", { name: "Simpan transaksi" });
  await confirm.dblclick();
  await dialog.getByRole("button", { name: "Memproses..." }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await dialog.isVisible(), true, "pending harus mengunci Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(state.directRequests.length, 1, "double-submit pending hanya boleh mengirim satu POST");
  assert.equal(await form.getByLabel("Keperluan").inputValue(), "Pembelian perlengkapan kebersihan masjid", "409 harus mempertahankan input");
  assert.equal(await dialog.count(), 0, "409 harus melepas ownership dialog setelah pending selesai");
  assert.equal(await submit.evaluate((node) => node === document.activeElement), true, "fokus harus kembali ke trigger submit setelah 409");

  await submit.click();
  await page.getByRole("dialog", { name: "Simpan transaksi kas?" }).getByRole("button", { name: "Simpan transaksi" }).click();
  await page.getByRole("dialog", { name: "Simpan transaksi kas?" }).waitFor({ state: "hidden" });
  assert.equal(state.directRequests.length, 2);
  assert.equal(await form.getByLabel("Keperluan").inputValue(), "Pembelian perlengkapan kebersihan masjid", "503 harus mempertahankan input");
  assert.equal(state.directRequests[0].key, state.directRequests[1].key, "retry payload identik harus memakai key sama");
  assert.equal(await submit.evaluate((node) => node === document.activeElement), true, "fokus harus kembali ke trigger submit setelah 503");

  await submit.click();
  await page.getByRole("dialog", { name: "Simpan transaksi kas?" }).getByRole("button", { name: "Simpan transaksi" }).click();
  await page.getByRole("dialog", { name: "Simpan transaksi kas?" }).waitFor({ state: "hidden" });
  assert.equal(state.directRequests.length, 3);
  assert.equal(state.directRequests[1].key, state.directRequests[2].key, "retry sukses tetap memakai key payload yang sama");
  assert.equal(await form.getByLabel("Keperluan").inputValue(), "", "success harus reset keperluan");
  assert.equal(await submit.evaluate((node) => node === document.activeElement), true, "success harus mengembalikan fokus ke trigger submit visible");
  assert.equal(state.transactions[0].keperluan, "Pembelian perlengkapan kebersihan masjid");
  await page.goto(`${baseURL}/admin/finance/transaksi`);
  await page.getByRole("heading", { name: "Transaksi", exact: true }).waitFor();
  await page.getByRole("button", { name: /Pembelian perlengkapan kebersihan masjid/ }).waitFor();
  await assertNoHorizontalOverflow(page, `direct cash desk ${viewport.width}`);
  await context.close();
}

async function filterRemountRegression(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const [currentYear, currentMonth] = currentWibDate.split("-").map(Number);
  const targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentMonthName = monthNames[currentMonth - 1];
  const targetMonthName = monthNames[targetMonth - 1];
  const targetPurpose = `Transaksi ${targetMonthName}`;
  const state = await installFixture(page, "bendahara", {
    transactions: [
      makeTransaction("approved", 601),
      { ...makeTransaction("approved", 602), tanggal: `${targetYear}-${String(targetMonth).padStart(2, "0")}-12`, keperluan: targetPurpose, keterangan: `Rincian ${targetPurpose}` },
    ],
  });
  await openFinance(page);
  await page.goto(`${baseURL}/admin/finance/transaksi`);
  await page.getByRole("heading", { name: "Transaksi", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Transaksi", exact: true }).waitFor();

  await page.getByRole("button", { name: "Filter transaksi" }).click();
  await page.getByRole("button", { name: currentMonthName }).click();
  await page.getByRole("menuitemradio", { name: targetMonthName }).click();
  await page.getByRole("button", { name: new RegExp(targetPurpose) }).waitFor();

  await page.getByLabel("Workflow keuangan").getByRole("link", { name: "Catat kas", exact: true }).click();
  await page.getByRole("heading", { name: "Catat kas", exact: true }).waitFor();
  await page.goto(`${baseURL}/admin/finance/transaksi`);
  await page.getByRole("heading", { name: "Transaksi", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Transaksi", exact: true }).waitFor();

  const requestsBefore = state.transactionRequests.length;
  await page.getByRole("button", { name: "Filter transaksi" }).click();
  await page.getByRole("button", { name: currentMonthName }).click();
  await page.getByRole("menuitemradio", { name: targetMonthName }).click();
  await page.getByRole("button", { name: new RegExp(targetPurpose) }).waitFor();
  assert.ok(state.transactionRequests.length > requestsBefore, "filter setelah child-route remount harus mengirim request baru");
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1024, height: 1366 }, { width: 1366, height: 900 }]) {
    await roleJourney(browser, viewport);
  }
  await recoveryAndConflict(browser, { width: 360, height: 800 });
  await recoveryAndConflict(browser, { width: 1366, height: 900 });
  for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1024, height: 1366 }, { width: 1366, height: 900 }]) {
    await directCashDeskJourney(browser, viewport);
  }
  for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1024, height: 1366 }, { width: 1366, height: 900 }]) {
    await filterRemountRegression(browser, viewport);
  }
  console.log(JSON.stringify({ browser: "chromium", viewports: ["360x800", "768x1024", "1024x1366", "1366x900"], roleJourney: "pass", directCashDesk: "pass-4-viewports", directRetry: "409-503-success", voidReason: "pass", recovery: "pass", conflict: "pass", filterRemount: "pass-4-viewports", focusEscapePending: "pass", overflow: "pass" }));
} finally {
  await browser.close();
}
