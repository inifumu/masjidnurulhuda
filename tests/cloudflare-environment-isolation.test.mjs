import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("deploy testing menukar config hanya di workspace sementara", async () => {
  const workflow = await read(".github/workflows/deploy-testing.yml");
  assert.match(workflow, /mkdir -p \.wrangler\/testing-deploy/);
  assert.match(workflow, /cp wrangler\.testing\.toml \.wrangler\/testing-deploy\/wrangler\.toml/);
  assert.match(workflow, /cp -R dist functions \.wrangler\/testing-deploy\//);
  assert.match(workflow, /wrangler pages deploy dist .*--cwd \.wrangler\/testing-deploy/);
  assert.doesNotMatch(workflow, /cp wrangler\.testing\.toml wrangler\.toml/);
});

test("config testing dan production mengikat resource yang berbeda", async () => {
  const [testing, production] = await Promise.all([
    read("wrangler.testing.toml"),
    read("wrangler.toml"),
  ]);
  assert.match(testing, /database_name = "masjidnurulhuda-testing-db"/);
  assert.match(testing, /bucket_name = "masjidnurulhuda-testing-media"/);
  assert.match(production, /database_name = "masjidnurulhuda-db"/);
  assert.match(production, /bucket_name = "masjidnurulhuda-media"/);
  assert.notEqual(testing, production);
});
