import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("deploy testing menukar config hanya di workspace sementara", async () => {
  const workflow = await read(".github/workflows/deploy-testing.yml");
  assert.match(workflow, /mkdir -p \.wrangler\/testing-deploy/);
  assert.match(workflow, /cp wrangler\.testing\.toml \.wrangler\/testing-deploy\/wrangler\.toml/);
  assert.match(workflow, /cp -R dist functions server shared \.wrangler\/testing-deploy\//);
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

test("config revamp mengikat Pages, D1, dan R2 yang terisolasi", async () => {
  const [revamp, testing, production, workflow] = await Promise.all([
    read("wrangler.revamp.toml"),
    read("wrangler.testing.toml"),
    read("wrangler.toml"),
    read(".github/workflows/deploy-revamp.yml"),
  ]);

  assert.match(revamp, /name = "masjidnurulhuda-revamp"/);
  assert.match(revamp, /database_name = "masjidnurulhuda-revamp-db"/);
  assert.match(revamp, /bucket_name = "masjidnurulhuda-revamp-media"/);
  assert.doesNotMatch(revamp, /masjidnurulhuda-testing-db|masjidnurulhuda-testing-media/);
  assert.notEqual(revamp, testing);
  assert.notEqual(revamp, production);
  assert.match(workflow, /branches:\s*\n\s*- revamp\/full-product/);
  assert.match(workflow, /environment: revamp/);
  assert.match(workflow, /wrangler\.revamp\.toml/);
  assert.match(workflow, /\.wrangler\/revamp-deploy\/wrangler\.toml/);
  assert.match(workflow, /cp -R dist functions server shared/);
  assert.match(workflow, /--project-name masjidnurulhuda-revamp/);
});
