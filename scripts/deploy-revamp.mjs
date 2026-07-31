import { cp, mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const run = (args, cwd) => {
  const result = spawnSync(process.execPath, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Command gagal dengan exit ${result.status ?? 1}`);
};

const workspace = ".wrangler/revamp-deploy";

try {
  run(["node_modules/npm/bin/npm-cli.js", "run", "build"]);
  await rm(workspace, { recursive: true, force: true });
  await mkdir(workspace, { recursive: true });
  await cp("wrangler.revamp.toml", `${workspace}/wrangler.toml`);
  for (const directory of ["dist", "functions", "server", "shared"]) {
    await cp(directory, `${workspace}/${directory}`, { recursive: true });
  }
  run([
    "../../node_modules/wrangler/bin/wrangler.js",
    "pages", "deploy", "dist",
    "--project-name", "masjidnurulhuda-revamp",
    "--branch", "revamp/full-product",
    "--commit-dirty=true",
  ], workspace);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
