import assert from "node:assert/strict";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = new URL("../../", import.meta.url);
const rootPath = decodeURIComponent(root.pathname).replace(/^\/([A-Za-z]:)/, "$1");
const nonce = `${process.pid}-${Date.now()}`;
const fresh = `.wrangler/p0-migrations-fresh-${nonce}`;
const upgrade = `.wrangler/p0-migrations-upgrade-${nonce}`;
const partial = `.wrangler/p0-migrations-partial-${nonce}`;
const config = `.wrangler/p0-migrations-${nonce}.toml`;
const knownDefault = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

const run = (args) => {
  const result = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", ...args], { cwd: rootPath, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${args.join(" ")}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return result.stdout;
};
const execute = (persistTo, sql, configPath) => JSON.parse(run(["d1", "execute", "masjidnurulhuda-db", "--local", "--persist-to", persistTo, "--command", sql, "--json", ...(configPath ? ["--config", configPath] : [])]));
const rows = (result) => result.flatMap((item) => item.results ?? []);
const apply = (persistTo, configPath) => run(["d1", "migrations", "apply", "masjidnurulhuda-db", "--local", "--persist-to", persistTo, ...(configPath ? ["--config", configPath] : [])]);
const scalar = (persistTo, sql, configPath) => Number(Object.values(rows(execute(persistTo, sql, configPath))[0] ?? {})[0]);
const writeConfig = (migrationsDir) => writeFile(config, `name = "p0-migration-test"\ncompatibility_date = "2024-04-01"\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "masjidnurulhuda-db"\ndatabase_id = "p0-migration-test"\nmigrations_dir = "${migrationsDir.replaceAll("\\", "/")}"\n`);

try {
  await mkdir(".wrangler", { recursive: true });
  const migrationFiles = (await readdir("migrations")).filter((name) => /^\d{4}_.*\.sql$/.test(name)).sort();
  assert.equal(migrationFiles.at(-1)?.slice(0, 4), "0017");

  apply(fresh);
  assert.equal(scalar(fresh, "SELECT COUNT(*) AS count FROM d1_migrations"), 17);
  assert.equal(scalar(fresh, `SELECT COUNT(*) AS count FROM users WHERE password_hash = '${knownDefault}' AND is_active = 1`), 0, "fresh DB tidak boleh punya known default credential aktif");
  assert.equal(rows(execute(fresh, "PRAGMA foreign_key_check")).length, 0);
  assert.equal(scalar(fresh, "PRAGMA foreign_keys"), 1, "FK harus aktif setelah fresh chain");

  await mkdir(partial, { recursive: true });
  for (const file of migrationFiles.slice(0, 9)) await cp(`migrations/${file}`, `${partial}/${file}`);
  await writeConfig(`${rootPath}/${partial}`);
  apply(upgrade, config);
  execute(upgrade, "INSERT INTO kas_masjid (tipe,jumlah,keterangan,tanggal,kategori_id,status,created_by) VALUES ('pemasukan',125000,'Kas legacy terjaga','2026-01-01',1,'approved',1)", config);
  await rm(partial, { recursive: true, force: true });
  await mkdir(partial, { recursive: true });
  for (const file of migrationFiles.slice(0, 16)) await cp(`migrations/${file}`, `${partial}/${file}`);
  await writeConfig(`${rootPath}/${partial}`);
  apply(upgrade, config);
  execute(upgrade, "UPDATE users SET password_hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', is_active = 1 WHERE id = 1", config);
  await writeConfig(`${rootPath}/migrations`);
  apply(upgrade, config);

  assert.equal(scalar(upgrade, "SELECT COUNT(*) AS count FROM kas_masjid WHERE keterangan = 'Kas legacy terjaga' AND status = 'approved' AND jumlah = 125000", config), 1, "row/status kas legacy wajib terjaga");
  assert.equal(scalar(upgrade, "SELECT COUNT(*) AS count FROM users WHERE id = 1 AND password_hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' AND is_active = 1", config), 1, "password terotasi tidak boleh dinonaktifkan");
  assert.equal(scalar(upgrade, `SELECT COUNT(*) AS count FROM users WHERE password_hash = '${knownDefault}' AND is_active = 1`, config), 0);
  assert.equal(scalar(upgrade, "SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='transaction_audit_events'", config), 1);
  for (const index of ["idx_kas_status_tanggal", "idx_transaction_audit_transaction_created", "idx_login_rate_limits_blocked_until"]) assert.equal(scalar(upgrade, `SELECT COUNT(*) AS count FROM sqlite_master WHERE type='index' AND name='${index}'`, config), 1, `index ${index} wajib tersedia`);
  assert.equal(rows(execute(upgrade, "PRAGMA foreign_key_check", config)).length, 0);
  assert.equal(scalar(upgrade, "PRAGMA foreign_keys", config), 1, "FK harus aktif setelah upgrade chain");
  console.log(JSON.stringify({ freshMigrations: 17, defaultCredentialActive: false, rotatedAccountPreserved: true, legacyCashPreserved: true, indexes: "available", transactionAuditEvents: "available", foreignKeys: "active-clean" }));
} finally {
  await Promise.allSettled([rm(fresh, { recursive: true, force: true }), rm(upgrade, { recursive: true, force: true }), rm(partial, { recursive: true, force: true }), rm(config, { force: true })]);
}
