import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = new URL("../../", import.meta.url);
const rootPath = decodeURIComponent(root.pathname).replace(/^\/([A-Za-z]:)/, "$1");
const nonce = `${process.pid}-${Date.now()}`;
const fresh = `.wrangler/p0-migrations-fresh-${nonce}`;
const upgrade = `.wrangler/p0-migrations-upgrade-${nonce}`;
const beforeLatest = `.wrangler/p0-migrations-before-latest-${nonce}`;
const config = `.wrangler/p0-before-latest-${nonce}.toml`;

const run = (args) => {
  const result = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", ...args], {
    cwd: rootPath,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")}\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  return result.stdout;
};

const execute = (persistTo, sql, config) => JSON.parse(run([
  "d1", "execute", "masjidnurulhuda-db", "--local", "--persist-to", persistTo,
  "--command", sql, "--json", ...(config ? ["--config", config] : []),
]));
const rows = (result) => result.flatMap((item) => item.results ?? []);
const apply = (persistTo, config) => run([
  "d1", "migrations", "apply", "masjidnurulhuda-db", "--local", "--persist-to", persistTo,
  ...(config ? ["--config", config] : []),
]);

try {
  await mkdir(".wrangler", { recursive: true });
  apply(fresh);
  const freshUsers = rows(execute(fresh, `SELECT COALESCE(operational_role, role) AS role, COUNT(*) AS count FROM users GROUP BY COALESCE(operational_role, role)`));
  assert.ok(freshUsers.some((row) => row.role === "bendahara" && Number(row.count) >= 1), "fresh migration wajib menghasilkan bendahara operasional");
  assert.equal(rows(execute(fresh, "PRAGMA foreign_key_check")).length, 0, "fresh foreign_key_check harus bersih");
  assert.equal(Number(rows(execute(fresh, "SELECT COUNT(*) AS count FROM d1_migrations"))[0]?.count), 16, "fresh ledger wajib mencatat 16 migration");
  assert.equal(Number(rows(execute(fresh, "SELECT COUNT(*) AS count FROM dokumentasi WHERE status = 'active'"))[0]?.count), 0, "fresh lifecycle media harus tersedia");

  const beforeLatestAbsolute = `${rootPath}/${beforeLatest}`.replaceAll("\\", "/");
  await writeFile(config, `name = "p0-migration-before-latest"\ncompatibility_date = "2024-04-01"\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "masjidnurulhuda-db"\ndatabase_id = "p0-before-latest"\nmigrations_dir = "${beforeLatestAbsolute}"\n`);
  await mkdir(beforeLatest, { recursive: true });
  for (let index = 1; index <= 15; index += 1) {
    const prefix = String(index).padStart(4, "0");
    const { cp } = await import("node:fs/promises");
    const { readdir } = await import("node:fs/promises");
    const migrations = await readdir("migrations");
    const file = migrations.find((name) => name.startsWith(`${prefix}_`));
    assert.ok(file, `migration ${prefix} tidak ditemukan`);
    await cp(`migrations/${file}`, `${beforeLatest}/${file}`);
  }
  apply(upgrade, config);
  execute(upgrade, `INSERT INTO dokumentasi (file_url,storage_key,kategori_penggunaan,mime_type,size_bytes,uploaded_by) VALUES ('/api/public/media/legacy.webp','media/legacy.webp','general','image/webp',10,1)`, config);
  const allMigrationsAbsolute = `${rootPath}/migrations`.replaceAll("\\", "/");
  await writeFile(config, `name = "p0-migration-before-latest"\ncompatibility_date = "2024-04-01"\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "masjidnurulhuda-db"\ndatabase_id = "p0-before-latest"\nmigrations_dir = "${allMigrationsAbsolute}"\n`);
  apply(upgrade, config);
  const upgraded = rows(execute(upgrade, `SELECT COUNT(*) AS count FROM users WHERE COALESCE(operational_role, role) = 'bendahara'`, config));
  assert.equal(Number(upgraded[0]?.count), 1, "upgrade tidak boleh menduplikasi bendahara existing");
  assert.equal(rows(execute(upgrade, "SELECT status FROM dokumentasi WHERE storage_key = 'media/legacy.webp'", config))[0]?.status, "active", "upgrade wajib backfill media existing sebagai active");
  assert.equal(rows(execute(upgrade, "PRAGMA foreign_key_check", config)).length, 0, "upgrade foreign_key_check harus bersih");

  console.log(JSON.stringify({ freshMigrations: 16, freshBendahara: true, upgradePreservedBendahara: true, mediaLifecycle: "active", foreignKeys: "clean" }));
} finally {
  await Promise.allSettled([
    rm(fresh, { recursive: true, force: true }),
    rm(upgrade, { recursive: true, force: true }),
    rm(beforeLatest, { recursive: true, force: true }),
    rm(config, { force: true }),
  ]);
}
