import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("finance memakai satu route transaksi canonical tanpa route evaluasi", async () => {
  const [router, host, sidebar, layout] = await Promise.all([
    read("src/router/index.ts"),
    read("src/views/admin/FinanceV2.vue"),
    read("src/components/admin/shell/AdminSidebar.vue"),
    read("src/layouts/AdminLayoutV2.vue"),
  ]);
  assert.match(router, /path: "transaksi", name: "admin-finance-transactions"/);
  assert.match(router, /redirect: \{ name: "admin-finance-transactions" \}/);
  assert.match(sidebar, /name: "Transaksi", to: "\/admin\/finance\/transaksi"/);
  assert.match(host, /admin-finance-transactions/);
  assert.match(host, /scrollIntoView\(\{ block: "nearest", inline: "center" \}\)/);
  assert.match(host, /<nav aria-label="Workflow keuangan" class="flex gap-1 overflow-x-auto border-b pb-2">/);
  assert.doesNotMatch(host, /Keuangan masjid|Ruang kerja keuangan|Pilih workflow sesuai tugas/);
  for (const source of [router, host, sidebar, layout]) {
    assert.doesNotMatch(source, /transaksi-alt|transactions-alt|Transaksi Alt|isAltEvaluation/);
  }
});

test("setiap workflow keuangan memiliki child view nyata", async () => {
  for (const file of ["TransactionsView.vue", "DirectTransactionView.vue", "ProposalsView.vue", "ApprovalsView.vue", "AuditHistoryView.vue"]) {
    assert.match(await read(`src/views/admin/finance/${file}`), /<section/);
  }
});

test("Catat kas memakai file presentasi baru agar arah redesign tidak lagi dikunci KasInput legacy", async () => {
  const [view, form, legacyBridge] = await Promise.all([
    read("src/views/admin/finance/DirectTransactionView.vue"),
    read("src/components/admin/kas/DirectCashDesk.vue"),
    read("src/components/legacy/KeuanganKasLegacyBridge.vue"),
  ]);
  assert.match(view, /import DirectCashDesk/);
  assert.match(view, /<DirectCashDesk v-else \/>/);
  assert.doesNotMatch(view, /import KasInput from/);
  assert.match(legacyBridge, /<KasInput v-else-if="activeTab === 'input'" \/>/);
  assert.match(view, /ErrorState/);
  assert.match(view, /Skeleton/);
  assert.match(view, /xl:flex-row xl:items-end xl:justify-between/);
  assert.doesNotMatch(view, /md:flex-row md:items-end md:justify-between/);
  assert.match(form, /FormField/);
  assert.match(form, /DropdownMenuRadioGroup/);
  assert.match(form, /DropdownMenuRadioItem/);
  assert.doesNotMatch(form, /@\/components\/ui\/select|<Select/);
  assert.match(form, /Collapsible/);
  assert.match(form, /role="radiogroup"/);
  assert.match(form, /data-cash-flow-switch/);
  assert.match(form, /data-entry-spine/);
  assert.match(form, /data-entry-decision/);
  assert.match(form, /data-entry-identity/);
  assert.match(form, /data-entry-closure/);
  assert.doesNotMatch(form, /data-live-cash-slip|useMediaQuery/);
  assert.doesNotMatch(form, />\s*[123]\s*[·.]|Langkah\s+[123]|task order/i);
  assert.match(form, /const reviewTitle = computed\(/);
  assert.match(form, /const reviewAmount = computed\(/);
  assert.match(form, /const reviewCategoryLabel = computed\(/);
  assert.match(form, /const reviewSectionLabel = computed\(/);
  assert.match(form, /const flowOptions = \[/);
  assert.match(form, /<Dialog :open="isConfirmDialogOpen"/);
  assert.match(form, /if \(isLoading\.value\) return;/);
  assert.doesNotMatch(form, /if \(isLoading\) return;/);
  assert.match(form, /submitButton/);
  assert.match(form, /focusSubmitTrigger/);
  assert.match(form, /import DirectCashSlip/);
  assert.equal((form.match(/<DirectCashSlip/g) ?? []).length, 1, "Slip final hanya dimiliki Dialog");
  assert.match(form, /const reviewTitle = computed\(\(\) => formInput\.value\.keperluan \|\| "Belum diisi"\)/);
  assert.match(await read("src/components/admin/kas/DirectCashSlip.vue"), /v-if="description\?\.trim\(\)"/);
  assert.match(form, /isLoading && \$event\.preventDefault\(\)/);
  assert.match(form, /ApiError/);
  assert.match(form, /focusFirstError/);
  assert.match(form, /toast\.dismiss\(\);\s*isConfirmDialogOpen\.value = true/);
  assert.match(form, /<Eye v-else class="size-4"/);
  assert.equal((form.match(/<Save\b/g) ?? []).length, 1, "ikon simpan hanya tampil pada mutation final");
  assert.match(form, /label="Keperluan"[^]*control-gap="comfortable"[^]*required/);
  assert.match(form, /label="Tanggal transaksi"[^]*control-gap="comfortable"[^]*required/);
  assert.match(form, /label="Kategori"[^]*control-gap="comfortable"[^]*required/);
  assert.match(form, /<FormField[\s\S]*label="Keterangan tambahan"[\s\S]*Tampil pada detail transaksi, bukan sebagai judul aktivitas\./);
  assert.match(form, /catch \(error: unknown\) \{\s*isConfirmDialogOpen\.value = false;/);
  assert.match(form, /data-direct-cash-desk/);
  assert.match(form, /aria-label="Arus transaksi"/);
  assert.match(form, /Semua input tetap dipertahankan untuk percobaan berikutnya/);
  assert.match(form, /data-entry-spine class="overflow-hidden rounded-xl bg-card ring-1 ring-foreground\/10"/);
  assert.doesNotMatch(form, /<DropdownMenuContent[^>]*class="rounded-md"/);
  assert.doesNotMatch(form, /<DropdownMenuRadioItem[^>]*class="[^"]*rounded-sm/);
  assert.match(form, /DatePicker/);
  assert.match(form, /Tinjau & simpan/);
  assert.match(form, /[+＋] Tambahkan seksi pelapor/);
  assert.doesNotMatch(form, /CollapsibleContent class="pt-3"><div class="xl:grid xl:grid-cols-2"><FormField label="Seksi pelapor"/);
  assert.match(form, /DropdownMenuContent align="end" class="!w-\[min\(32rem,calc\(100vw-2rem\)\)\]"/);
  assert.match(form, /DropdownMenuRadioGroup[^>]*class="grid grid-cols-2"[^>]*:model-value="formInput\.seksi_id/);
  assert.match(form, /class="h-11 min-w-0 whitespace-nowrap px-2 pr-8 xl:h-8"/);
  assert.doesNotMatch(form, /data-compact-cash-recap/);
  assert.doesNotMatch(form, /dark:bg-\[#/);
  assert.doesNotMatch(form, /catch \(error: any\)/);
  assert.doesNotMatch(form, /<div class="grid gap-5 border-t pt-6 md:grid-cols-2">/);
});

test("DatePicker meneruskan identity ke trigger DOM nyata", async () => {
  const source = await read("src/components/ui/datepicker/DatePicker.vue");
  assert.match(source, /id\?: string/);
  assert.match(source, /:id="id"/);
  assert.match(source, /:aria-labelledby="labelledby"/);
  assert.match(source, /:aria-describedby="describedby"/);
});

test("first-error Catat kas mengikuti reading order nominal lalu keperluan tanggal kategori", async () => {
  const source = await read("src/components/admin/kas/DirectCashDesk.vue");
  assert.match(source, /const validationOrder[^=]*= \["jumlah", "keperluan", "tanggal", "kategori", "keterangan"\]/);
  assert.match(source, /validationOrder\.find/);
});

test("state dan payload kas memisahkan judul dari detail serta reset keduanya", async () => {
  const [state, service, actions] = await Promise.all([
    read("src/composables/admin/kas/useKasState.ts"),
    read("src/services/admin/kasService.ts"),
    read("src/composables/admin/kas/useKasActions.ts"),
  ]);
  assert.match(state, /keperluan: string/);
  assert.match(service, /keperluan: string/);
  assert.match(service, /keperluan: form\.keperluan\.trim\(\)/);
  assert.match(service, /keterangan: form\.keterangan\.trim\(\)/);
  assert.match(actions, /formInput\.value\.keperluan = ""/);
  assert.match(actions, /formProposal\.value\.keperluan = ""/);
});

test("Proposal Request Brief mengikuti composition terpilih tanpa fork mutation", async () => {
  const [proposal, proposalView] = await Promise.all([
    read("src/components/admin/kas/KasProposal.vue"),
    read("src/views/admin/finance/ProposalsView.vue"),
  ]);
  assert.match(proposalView, /<template v-else>[^]*<KasProposal \/>[^]*<\/template>/);
  assert.doesNotMatch(proposalView, /v-else class="rounded-md border bg-card p-4 sm:p-6"/);
  for (const primitive of ["button", "datepicker", "dialog", "dropdown-menu", "form-field", "input", "textarea"]) {
    assert.match(proposal, new RegExp(`@/components/ui/${primitive}`));
  }
  assert.match(proposal, /data-proposal-request-brief/);
  assert.match(proposal, /data-request-brief-main/);
  assert.match(proposal, /data-request-brief-metadata/);
  assert.match(proposal, /xl:grid-cols-\[minmax\(0,1\.45fr\)_minmax\(18rem,0\.7fr\)\]/);
  assert.equal((proposal.match(/Review pengajuan/g) ?? []).length, 1);
  assert.match(proposal, /handleProposal\(\)/);
  assert.match(proposal, /const validationOrder[^=]*= \["keperluan", "jumlah", "keterangan", "kategori", "tanggal", "seksi"\]/);
  assert.match(proposal, /data-field="keperluan"[^]*data-field="arus"[^]*data-field="jumlah"[^]*data-field="keterangan"[^]*data-field="kategori"[^]*data-field="tanggal"[^]*data-field="metode"[^]*data-field="seksi"[^]*data-proposal-completion/);
  assert.match(proposal, /data-request-brief-main[^]*data-request-brief-metadata[^]*data-field="seksi"[^]*data-proposal-completion[^]*Review pengajuan[^]*<\/aside>/);
  assert.doesNotMatch(proposal, /xl:sticky|xl:top-/);
  assert.doesNotMatch(proposal, /\border-(?:first|last|none|\[)/);
  assert.match(proposal, /if \(isLoading\.value\) return/);
  assert.match(proposal, /keperluan\.trim\(\)\.length < 5/);
  assert.match(proposal, /keterangan\.trim\(\)\.length < 10/);
  assert.match(proposal, /keterangan\.trim\(\)\.length > 2000/);
  assert.match(proposal, /maxlength="2000"/);
  assert.match(proposal, /Menunggu persetujuan ketua/);
  assert.match(proposal, /Menunggu pencairan bendahara/);
  assert.match(proposal, /isLoading && \$event\.preventDefault\(\)/);
  assert.match(proposal, /submitError\.value = error instanceof ApiError && error\.status === 409[^]*\? conflictMessage/);
  assert.match(proposal, /resolveElement\(purposeInput\.value\)\?\.focus\(\)/);
  assert.match(proposalView, /loadError && hasLoadedData[^]*Data referensi mungkin sudah berubah[^]*<Button[^]*@click="loadData"/);
  assert.doesNotMatch(proposal, /data-proposal-entry-spine|Arahkan pengajuan|Kebutuhan dan routing/);
  assert.doesNotMatch(proposal, /ConfirmModal|toggleDropdown|openDropdown|bg-slate|dark:bg-\[#/);
  assert.doesNotMatch(proposal, /catch \(error: any\)/);
});

test("Transaksi canonical memakai workspace shadcn dan orchestration finance existing", async () => {
  const [view, workspace] = await Promise.all([
    read("src/views/admin/finance/TransactionsView.vue"),
    read("src/components/admin/finance/TransactionWorkspace.vue"),
  ]);
  assert.match(view, /import TransactionWorkspace/);
  assert.match(view, /useKas\(\)/);
  assert.match(view, /getTransactionTimeline/);
  assert.match(view, /timelineTransactionId\.value = id/);
  assert.doesNotMatch(view, /timelineTransactionId\.value = null/);
  assert.match(view, /data-transaction-row/);
  assert.match(view, /TransactionAuditDialog/);
  assert.match(view, /ApiError/);
  for (const primitive of ["button", "input", "dropdown-menu", "sheet", "status", "card", "collapsible", "scroll-area", "timeline"]) {
    assert.match(workspace, new RegExp(`@/components/ui/${primitive}`));
  }
  assert.doesNotMatch(workspace, /TransactionWorkspaceAlt|TransactionLedger|Filter transaksi Alt|data-alt-/);
});

test("workspace mempertahankan filter server-bound dan responsive list-detail", async () => {
  const source = await read("src/components/admin/finance/TransactionWorkspace.vue");
  assert.match(source, /getCurrentWibPeriod/);
  assert.doesNotMatch(source, /new Date\(\)\.getMonth|new Date\(\)\.getFullYear/);
  assert.match(source, /emit\("update:month",currentMonth\)/);
  assert.match(source, /emit\("update:year",currentYear\)/);
  assert.match(source, /emit\("update:flow","semua"\)/);
  assert.match(source, /emit\("update:category","semua"\)/);
  assert.match(source, /data-filter-surface[^]*data-filter-segments[^]*data-filter-primary/);
  assert.match(source, /DropdownMenuRadioGroup class="grid grid-cols-2"/);
  assert.match(source, /window\.innerWidth < 1280/);
  assert.match(source, /useMediaQuery\("\(min-width: 1280px\)"\)/);
  assert.match(source, /v-if="activeTransaction\.keterangan"/);
  assert.match(source, />Keterangan<\/h3>/);
  assert.match(source, /watch\(isWideDesktop,\(wide\)=>\{if\(wide\)detailOpen\.value=false\}\)/);
  assert.match(source, /min-h-\[5\.25rem\] w-full max-w-full/);
  assert.doesNotMatch(source, /w-\[calc\(100vw/);
});

test("detail dan void dialog tidak membentuk nested modal serta memulihkan fokus", async () => {
  const [view, workspace] = await Promise.all([
    read("src/views/admin/finance/TransactionsView.vue"),
    read("src/components/admin/finance/TransactionWorkspace.vue"),
  ]);
  assert.match(workspace, /detailOpen\.value=false;await nextTick\(\);emit\("void",id\)/);
  assert.match(workspace, /data-transaction-row/);
  assert.match(view, /triggerSelector\.value = `\[data-transaction-row="\$\{id\}"\]`/);
  assert.match(workspace, /:disabled="pendingIds\.has\(activeTransaction\.id\)"/);
  assert.match(workspace, /v-else-if="timelineError" role="alert"/);
  assert.match(workspace, /history_available/);
  assert.match(workspace, /canVoid\(authStore\.user\?\.role\)/);
  assert.match(workspace, /activeTransaction\.status === ['"]approved['"]/);
});

test("checkpoint TransactionLedger tetap hanya untuk caller parity legacy", async () => {
  const [legacy, ledger] = await Promise.all([
    read("src/views/admin/finance/FinanceLegacyView.vue"),
    read("src/components/admin/finance/TransactionLedger.vue"),
  ]);
  assert.match(legacy, /import TransactionLedger/);
  assert.match(legacy, /<TransactionLedger/);
  assert.match(ledger, /void_reason/);
});
