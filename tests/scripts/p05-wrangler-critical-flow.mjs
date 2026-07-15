import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const runId = `p05-${process.pid}-${Date.now()}`;
const stateDir = resolve(root, ".wrangler", runId);
const configPath = resolve(stateDir, "wrangler.toml");
const port = 8800 + (process.pid % 500);
const base = `http://127.0.0.1:${port}`;
const origin = new URL(base).origin;
const database = `p05-${runId}`;
const secret = `local-only-${runId}-jwt-secret`;
const wrangler = resolve(root, "node_modules/wrangler/bin/wrangler.js");
const password = "password";
const passwordHash = createHash("sha256").update(password).digest("hex");
let server;

const wranglerArgs = (...args) => [wrangler, ...args, "--config", configPath];
const execWrangler = (...args) => {
  const result = spawnSync(process.execPath, wranglerArgs(...args), {
    cwd: root, encoding: "utf8", env: { ...process.env, CI: "1", NO_COLOR: "1" },
  });
  if (result.status !== 0) throw new Error(`wrangler ${args.join(" ")} gagal\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};
const sql = (command) => execWrangler("d1", "execute", database, "--local", "--persist-to", stateDir, "--command", command);
const key = (label) => `${runId}-${label}`.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 100).padEnd(16, "x");
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const request = async (cookie, path, init = {}) => {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...(cookie ? { cookie } : {}), origin, ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body };
};
const expectStatus = async (cookie, path, status, init) => {
  const result = await request(cookie, path, init);
  assert.equal(result.response.status, status, `${init?.method ?? "GET"} ${path}: ${JSON.stringify(result.body)}`);
  return result.body;
};
const mutate = (cookie, path, body, label, method = "POST") => expectStatus(cookie, path, 201, {
  method, headers: { "Idempotency-Key": key(label) }, body: JSON.stringify(body),
});
const login = async (email) => {
  const result = await request(null, "/api/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  assert.equal(result.response.status, 200, `${email}: ${JSON.stringify(result.body)}`);
  const cookie = result.response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  return cookie;
};
const proposal = (label, overrides = {}) => ({
  tipe: "pengeluaran", jumlah: 10000, keterangan: `${runId} ${label}`, tanggal: "2026-07-14",
  kategori_id: 2, seksi_id: 1, metode: "reimbursement", ...overrides,
});
const submit = async (cookie, label, overrides) => {
  const body = proposal(label, overrides);
  const created = await mutate(cookie, "/api/admin/transaction/add-proposal", body, `submit-${label}`);
  return { id: created.data.transaction_id, body };
};
const transition = (cookie, id, action, label, reason, status = 200) => expectStatus(cookie, `/api/admin/transaction/approve/${id}`, status, {
  method: "POST", headers: { "Idempotency-Key": key(label) }, body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
});

await mkdir(stateDir, { recursive: true });
await writeFile(configPath, `name = "${database}"\ncompatibility_date = "2024-04-01"\npages_build_output_dir = "${resolve(root, "dist").replaceAll("\\", "/")}"\n[vars]\nJWT_SECRET = "${secret}"\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "${database}"\ndatabase_id = "00000000-0000-0000-0000-000000000001"\nmigrations_dir = "${resolve(root, "migrations").replaceAll("\\", "/")}"\n`);

let primaryError;
try {
  execWrangler("d1", "migrations", "apply", database, "--local", "--persist-to", stateDir);
  sql(`INSERT INTO users (name,email,password_hash,role,operational_role,is_active,token_version) VALUES
    ('P05 Pengurus A','p05-a@example.test','${passwordHash}','pengurus','pengurus',1,0),
    ('P05 Pengurus B','p05-b@example.test','${passwordHash}','pengurus','pengurus',1,0),
    ('P05 Ketua','p05-ketua@example.test','${passwordHash}','ketua','ketua',1,0),
    ('P05 Bendahara','p05-bendahara@example.test','${passwordHash}','pengurus','bendahara',1,0);`);

  server = spawn(process.execPath, wranglerArgs("dev", resolve(root, "server/index.ts"), "--ip", "127.0.0.1", "--port", String(port), "--persist-to", stateDir), {
    cwd: root, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, CI: "1", NO_COLOR: "1" },
  });
  let logs = "";
  server.stdout.on("data", (chunk) => { logs += chunk; });
  server.stderr.on("data", (chunk) => { logs += chunk; });
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(`${base}/api/public/hello`)).ok) break; } catch {}
    if (attempt === 79) throw new Error(`Pages dev tidak siap:\n${logs}`);
    await sleep(250);
  }

  const cookies = {
    a: await login("p05-a@example.test"), b: await login("p05-b@example.test"),
    ketua: await login("p05-ketua@example.test"), bendahara: await login("p05-bendahara@example.test"),
  };

  // Full read matrix + direct-create mutation matrix.
  for (const [role, cookie] of Object.entries(cookies)) {
    for (const path of ["/api/admin/transaction/master-data", "/api/admin/transaction/pending", "/api/admin/transaction/list?month=7&year=2026", "/api/admin/dashboard/summary?month=7&year=2026"])
      await expectStatus(cookie, path, 200);
    const direct = proposal(`direct-${role}`, { tipe: "pemasukan", metode: "kas_langsung" });
    await expectStatus(cookie, "/api/admin/transaction/add-direct", role === "a" || role === "b" ? 403 : 201, {
      method: "POST", headers: { "Idempotency-Key": key(`direct-${role}`) }, body: JSON.stringify(direct),
    });
  }

  // Replay persists exactly one transaction, event, and registry row.
  const replayBody = proposal("replay");
  const replayKey = key("replay-submit");
  const replay1 = await expectStatus(cookies.a, "/api/admin/transaction/add-proposal", 201, { method: "POST", headers: { "Idempotency-Key": replayKey }, body: JSON.stringify(replayBody) });
  const replay2 = await expectStatus(cookies.a, "/api/admin/transaction/add-proposal", 201, { method: "POST", headers: { "Idempotency-Key": replayKey }, body: JSON.stringify(replayBody) });
  assert.deepEqual(replay2.data, replay1.data);

  // Concurrent/stale approval: exactly one winner and one conflict.
  const concurrent = await submit(cookies.a, "concurrent");
  await transition(cookies.ketua, concurrent.id, "approve", "concurrent-to-bendahara", null, 200);
  const concurrentResults = await Promise.all(["a", "b"].map((suffix) => request(cookies.bendahara, `/api/admin/transaction/approve/${concurrent.id}`, {
    method: "POST", headers: { "Idempotency-Key": key(`concurrent-win-${suffix}`) }, body: JSON.stringify({ action: "approve" }),
  })));
  const concurrentStatuses = concurrentResults.map((result) => result.response.status);
  assert.equal(concurrentStatuses.filter((status) => status === 200).length, 1, `concurrent statuses: ${concurrentStatuses}`);
  assert.equal(concurrentStatuses.filter((status) => status === 409).length, 1, `concurrent statuses: ${concurrentStatuses}`);
  await transition(cookies.bendahara, concurrent.id, "approve", "explicit-stale", null, 409);

  // Reject at both stages, mandatory reason, and stage role locks.
  const rejectKetua = await submit(cookies.a, "reject-ketua");
  await transition(cookies.ketua, rejectKetua.id, "reject", "reject-ketua-no-reason", null, 400);
  await transition(cookies.bendahara, rejectKetua.id, "reject", "reject-ketua-wrong-role", "Alasan bendahara tidak berhak", 403);
  await transition(cookies.ketua, rejectKetua.id, "reject", "reject-ketua-ok", "Anggaran kegiatan belum lengkap", 200);
  const rejectBendahara = await submit(cookies.b, "reject-bendahara");
  await transition(cookies.ketua, rejectBendahara.id, "approve", "to-bendahara", null, 200);
  await transition(cookies.ketua, rejectBendahara.id, "reject", "reject-bendahara-wrong", "Ketua tidak boleh menolak tahap ini", 403);
  await transition(cookies.bendahara, rejectBendahara.id, "reject", "reject-bendahara-ok", "Bukti pembayaran belum memenuhi syarat", 200);

  // Ownership: private pending/list/timeline isolated between two pengurus.
  const ownedA = await submit(cookies.a, "owned-a");
  const ownedB = await submit(cookies.b, "owned-b");
  const pendingA = await expectStatus(cookies.a, "/api/admin/transaction/pending", 200);
  assert.ok(pendingA.data.some((x) => x.id === ownedA.id));
  assert.ok(!pendingA.data.some((x) => x.id === ownedB.id));
  await expectStatus(cookies.a, `/api/admin/transaction/${ownedB.id}/timeline`, 403);
  await expectStatus(cookies.b, `/api/admin/transaction/${ownedB.id}/timeline`, 200);
  const listA = await expectStatus(cookies.a, "/api/admin/transaction/list?month=7&year=2026", 200);
  assert.ok(listA.data.some((x) => x.id === ownedA.id));
  assert.ok(!listA.data.some((x) => x.id === ownedB.id));

  // WIB/current-month boundaries and admin/public summaries use the same approved ledger.
  const wib = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const year = Number(wib.find((x) => x.type === "year").value);
  const month = Number(wib.find((x) => x.type === "month").value);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (const [label, date, amount] of [["boundary-first", `${year}-${String(month).padStart(2, "0")}-01`, 11001], ["boundary-last", `${year}-${String(month).padStart(2, "0")}-${lastDay}`, 22002]]) {
    await mutate(cookies.bendahara, "/api/admin/transaction/add-direct", proposal(label, { tipe: "pemasukan", jumlah: amount, tanggal: date, metode: "kas_langsung" }), label);
  }
  const adminList = await expectStatus(cookies.bendahara, `/api/admin/transaction/list?month=${month}&year=${year}`, 200);
  const adminSummary = await expectStatus(cookies.bendahara, `/api/admin/dashboard/summary?month=${month}&year=${year}`, 200);
  const publicSummary = await expectStatus(null, "/api/public/kas/summary", 200);
  const approvedRows = adminList.data.filter((x) => x.status === "approved");
  const pemasukan = approvedRows.filter((x) => x.tipe === "pemasukan").reduce((sum, x) => sum + x.jumlah, 0);
  const pengeluaran = approvedRows.filter((x) => x.tipe === "pengeluaran").reduce((sum, x) => sum + x.jumlah, 0);
  assert.equal(adminSummary.data.totalPemasukan, pemasukan);
  assert.equal(adminSummary.data.totalPengeluaran, pengeluaran);
  assert.equal(publicSummary.data.pemasukan_bulan_ini, pemasukan);
  assert.equal(publicSummary.data.pengeluaran_bulan_ini, pengeluaran);

  console.log(JSON.stringify({ ok: true, runId, concurrent: "1x200+1x409", ownership: "isolated", summaries: "consistent" }));
} catch (error) {
  primaryError = error;
} finally {
  if (server && !server.killed) {
    server.kill("SIGTERM");
    await Promise.race([new Promise((resolveExit) => server.once("exit", resolveExit)), sleep(3000)]);
    if (!server.killed) server.kill("SIGKILL");
  }
  try {
    // Child rows first; cleanup includes finance, audit, idempotency, auth/security/login and user fixtures.
    sql(`DELETE FROM transaction_idempotency_keys WHERE actor_id IN (SELECT id FROM users WHERE email LIKE 'p05-%@example.test');
      DELETE FROM transaction_audit_events WHERE actor_id IN (SELECT id FROM users WHERE email LIKE 'p05-%@example.test') OR transaction_id IN (SELECT id FROM kas_masjid WHERE keterangan LIKE '${runId}%');
      DELETE FROM kas_masjid WHERE keterangan LIKE '${runId}%';
      DELETE FROM security_audit_events WHERE actor_id IN (SELECT id FROM users WHERE email LIKE 'p05-%@example.test') OR target_user_id IN (SELECT id FROM users WHERE email LIKE 'p05-%@example.test') OR metadata_json LIKE '%p05-%@example.test%';
      DELETE FROM login_rate_limits;
      DELETE FROM users WHERE email LIKE 'p05-%@example.test';`);
    const countQueries = [
      `SELECT COUNT(*) AS count FROM kas_masjid WHERE keterangan LIKE '${runId}%'`,
      `SELECT COUNT(*) AS count FROM transaction_audit_events WHERE actor_id IN (SELECT id FROM users WHERE email LIKE 'p05-%@example.test')`,
      `SELECT COUNT(*) AS count FROM transaction_idempotency_keys WHERE actor_id IN (SELECT id FROM users WHERE email LIKE 'p05-%@example.test')`,
      `SELECT COUNT(*) AS count FROM security_audit_events WHERE metadata_json LIKE '%p05-%@example.test%'`,
      `SELECT COUNT(*) AS count FROM login_rate_limits`,
      `SELECT COUNT(*) AS count FROM users WHERE email LIKE 'p05-%@example.test'`,
    ];
    const verification = countQueries.map((query) => sql(query));
    const counts = verification.map((output) => Number(output.match(/"count"\s*:\s*(\d+)/)?.[1]));
    assert.ok(counts.length === 6 && counts.every((count) => count === 0), `cleanup count bukan 0: ${counts}`);
    const fk = sql("PRAGMA foreign_key_check");
    assert.ok(!fk.includes('"table"'), `foreign_key_check tidak bersih: ${fk}`);
    console.log(JSON.stringify({ cleanup: "all fixture counts 0", foreignKeys: "clean" }));
  } catch (cleanupError) {
    primaryError = primaryError ? new AggregateError([primaryError, cleanupError], "flow dan cleanup gagal") : cleanupError;
  }
  await rm(configPath, { force: true });
}
if (primaryError) throw primaryError;
